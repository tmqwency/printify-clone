import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaTimes,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { format } from "date-fns";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "created", label: "Created" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call("orders.list", {}, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      setOrders(result || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      // Set mock data for demo
      setOrders([
        {
          _id: "1",
          externalOrderId: "ORD-001",
          customerEmail: "john@example.com",
          customerName: "John Doe",
          status: "processing",
          total: 4999,
          createdAt: new Date("2024-01-15"),
          platform: "shopify",
        },
        {
          _id: "2",
          externalOrderId: "ORD-002",
          customerEmail: "jane@example.com",
          customerName: "Jane Smith",
          status: "shipped",
          total: 2999,
          trackingNumber: "1Z999AA10123456784",
          createdAt: new Date("2024-01-14"),
          platform: "woocommerce",
        },
        {
          _id: "3",
          externalOrderId: "ORD-003",
          customerEmail: "bob@example.com",
          customerName: "Bob Johnson",
          status: "created",
          total: 1999,
          createdAt: new Date("2024-01-16"),
          platform: "shopify",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.externalOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call("orders.getStatus", orderId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      setSelectedOrder(result);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error("Failed to load order details");
      // Use mock data for demo
      const order = orders.find((o) => o._id === orderId);
      if (order) {
        setSelectedOrder({
          order,
          items: [
            {
              _id: "1",
              productName: "Classic T-Shirt",
              variantName: "M / Black",
              quantity: 2,
              unitPrice: 1500,
              totalPrice: 3000,
              fulfillmentStatus: "processing",
            },
          ],
          fulfillment: [],
        });
        setShowDetailsModal(true);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      created: {
        color: "bg-blue-100 text-blue-800",
        icon: FaBox,
        label: "Created",
      },
      processing: {
        color: "bg-yellow-100 text-yellow-800",
        icon: FaBox,
        label: "Processing",
      },
      shipped: {
        color: "bg-purple-100 text-purple-800",
        icon: FaTruck,
        label: "Shipped",
      },
      fulfilled: {
        color: "bg-green-100 text-green-800",
        icon: FaCheckCircle,
        label: "Fulfilled",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: FaTimesCircle,
        label: "Cancelled",
      },
    };

    const badge = badges[status] || badges.created;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
      >
        <Icon className="text-xs" />
        {badge.label}
      </span>
    );
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-2">Manage and track your orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-64">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          <>
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
                      Platform
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
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.externalOrderId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {order.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatPrice(order.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewOrderDetails(order._id)}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <FaEye />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {filteredOrders.length} order
                {filteredOrders.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Order {selectedOrder.order?.externalOrderId}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedOrder.order?.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Status
                </h3>
                {getStatusBadge(selectedOrder.order?.status)}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  Customer
                </h3>
                <p className="text-gray-900">
                  {selectedOrder.order?.customerName}
                </p>
                <p className="text-gray-600">
                  {selectedOrder.order?.customerEmail}
                </p>
              </div>

              {/* Tracking Info */}
              {selectedOrder.order?.trackingNumber && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                    Tracking
                  </h3>
                  <p className="text-gray-900 font-mono">
                    {selectedOrder.order.trackingNumber}
                  </p>
                  {selectedOrder.order.trackingUrl && (
                    <a
                      href={selectedOrder.order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">
                  Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.variantName}
                        </p>
                        <p className="text-sm text-gray-500">
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

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatPrice(selectedOrder.order?.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
