import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Orders } from "../../../api/collections/orders";
import { Providers } from "../../../api/collections/Providers";
import {
  FaSearch,
  FaEye,
  FaCheck,
  FaTimes,
  FaTruck,
  FaBox,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManageOrders = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState({
    trackingNumber: "",
    carrier: "USPS",
    trackingUrl: "",
  });

  // Fetch orders
  const { orders, ordersLoading } = useTracker(() => {
    const handle = Meteor.subscribe("orders.all");
    const isReady = handle.ready();
    const ordersList = Orders.find({}, { sort: { createdAt: -1 } }).fetch();

    console.log("Orders subscription ready:", isReady);
    console.log("Orders count:", ordersList.length);

    return {
      orders: ordersList,
      ordersLoading: !isReady,
    };
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      order.externalOrderId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      created: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: FaClock,
        label: "Pending",
      },
      processing: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: FaBox,
        label: "Processing",
      },
      fulfilled: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        icon: FaCheckCircle,
        label: "Fulfilled",
      },
      shipped: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: FaTruck,
        label: "Shipped",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: FaTimesCircle,
        label: "Cancelled",
      },
    };

    const badge = badges[status] || badges.created;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        <Icon />
        {badge.label}
      </span>
    );
  };

  const handleViewDetails = (orderId) => {
    Meteor.call("orders.getDetails", orderId, (error, orderDetails) => {
      if (error) {
        toast.error("Failed to load order details");
        console.error(error);
      } else {
        // Fetch provider if assigned
        if (orderDetails.assignedProviderId) {
          Meteor.call(
            "providers.getById",
            orderDetails.assignedProviderId,
            (provError, provider) => {
              if (!provError && provider) {
                orderDetails.assignedProvider = provider;
              }
              setSelectedOrder(orderDetails);
              setShowDetailsModal(true);
            }
          );
        } else {
          setSelectedOrder(orderDetails);
          setShowDetailsModal(true);
        }
      }
    });
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    Meteor.call("orders.updateStatus", orderId, newStatus, (error) => {
      if (error) {
        toast.error("Failed to update order status");
        console.error(error);
      } else {
        toast.success(`Order status updated to ${newStatus}`);
        if (showDetailsModal && selectedOrder) {
          // Refresh order details
          handleViewDetails(orderId);
        }
      }
    });
  };

  const handleAddTracking = () => {
    if (!selectedOrder) return;

    if (!trackingData.trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    Meteor.call(
      "orders.updateTracking",
      selectedOrder._id,
      trackingData,
      (error) => {
        if (error) {
          toast.error("Failed to add tracking information");
          console.error(error);
        } else {
          toast.success("Tracking information added successfully!");
          setShowTrackingModal(false);
          setTrackingData({
            trackingNumber: "",
            carrier: "USPS",
            trackingUrl: "",
          });
          // Refresh order details
          handleViewDetails(selectedOrder._id);
        }
      }
    );
  };

  const handleCancelOrder = (orderId) => {
    const reason = prompt("Please enter cancellation reason:");
    if (!reason) return;

    Meteor.call("orders.cancel", orderId, reason, (error) => {
      if (error) {
        toast.error("Failed to cancel order");
        console.error(error);
      } else {
        toast.success("Order cancelled successfully");
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      }
    });
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "created").length,
    processing: orders.filter((o) => o.status === "processing").length,
    fulfilled: orders.filter((o) => o.status === "fulfilled").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
        <p className="text-gray-600 mt-2">Process and manage customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Pending</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Processing</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.processing}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Fulfilled</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.fulfilled}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Shipped</p>
          <p className="text-2xl font-bold text-green-600">{stats.shipped}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ID, customer email, or name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              "all",
              "created",
              "processing",
              "fulfilled",
              "shipped",
              "cancelled",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  filterStatus === status
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {ordersLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading orders...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Orders will appear here when customers make purchases"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.externalOrderId || order._id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(order._id)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <FaEye />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedOrder.externalOrderId || selectedOrder._id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex gap-2">
                  {selectedOrder.status === "created" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, "processing")
                      }
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                    >
                      Mark as Processing
                    </button>
                  )}
                  {selectedOrder.status === "processing" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder._id, "fulfilled")
                      }
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                    >
                      Mark as Fulfilled
                    </button>
                  )}
                  {selectedOrder.status === "fulfilled" && (
                    <button
                      onClick={() => setShowTrackingModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Add Tracking & Ship
                    </button>
                  )}
                  {!["shipped", "cancelled"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Name:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.customerName}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Email:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.customerEmail}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Shipping Address
                  </h3>
                  <div className="text-sm">
                    <p className="font-medium">
                      {selectedOrder.shippingAddress?.line1}
                    </p>
                    {selectedOrder.shippingAddress?.line2 && (
                      <p>{selectedOrder.shippingAddress.line2}</p>
                    )}
                    <p>
                      {selectedOrder.shippingAddress?.city},{" "}
                      {selectedOrder.shippingAddress?.state}{" "}
                      {selectedOrder.shippingAddress?.postalCode}
                    </p>
                    <p>{selectedOrder.shippingAddress?.country}</p>
                  </div>
                </div>
              </div>

              {/* Provider Information */}
              {selectedOrder.assignedProviderId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <FaTruck />
                    Assigned Provider
                  </h3>
                  {selectedOrder.assignedProvider ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">
                            {selectedOrder.assignedProvider.name}
                          </p>
                          <p className="text-blue-700">
                            {selectedOrder.assignedProvider.location?.country},{" "}
                            {selectedOrder.assignedProvider.location?.region}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedOrder.assignmentMethod === "auto"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {selectedOrder.assignmentMethod === "auto"
                            ? "Auto-assigned"
                            : "Manual"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                        <div>
                          <p className="text-blue-600">Production Time:</p>
                          <p className="font-medium text-blue-900">
                            {selectedOrder.assignedProvider.performance
                              ?.avgProductionTime || "N/A"}{" "}
                            days
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">Quality Rating:</p>
                          <p className="font-medium text-blue-900">
                            {selectedOrder.assignedProvider.performance
                              ?.qualityRating || "N/A"}
                            /5
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700">
                      Loading provider details...
                    </p>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-sm text-gray-600">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.unitPrice)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatPrice(selectedOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">
                      {formatPrice(selectedOrder.shippingCost)}
                    </span>
                  </div>
                  {selectedOrder.providerCost && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>Provider Cost:</span>
                        <span className="font-medium">
                          -{formatPrice(selectedOrder.providerCost)}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Profit:</span>
                        <span className="font-medium">
                          {formatPrice(
                            selectedOrder.total - selectedOrder.providerCost
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span className="text-primary-600">
                      {formatPrice(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {selectedOrder.trackingNumber && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Tracking Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-green-700">Carrier:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.carrier}
                      </span>
                    </p>
                    <p>
                      <span className="text-green-700">Tracking Number:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.trackingNumber}
                      </span>
                    </p>
                    {selectedOrder.trackingUrl && (
                      <a
                        href={selectedOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Track Package →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={() => setShowTrackingModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Add Tracking Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  value={trackingData.trackingNumber}
                  onChange={(e) =>
                    setTrackingData({
                      ...trackingData,
                      trackingNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1Z999AA10123456784"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrier *
                </label>
                <select
                  value={trackingData.carrier}
                  onChange={(e) =>
                    setTrackingData({
                      ...trackingData,
                      carrier: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="USPS">USPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={trackingData.trackingUrl}
                  onChange={(e) =>
                    setTrackingData({
                      ...trackingData,
                      trackingUrl: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://tools.usps.com/go/TrackConfirmAction..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTracking}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                >
                  Add Tracking & Ship
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
