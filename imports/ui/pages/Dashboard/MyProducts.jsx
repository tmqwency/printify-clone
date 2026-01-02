import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaShoppingCart,
  FaTimes,
  FaCopy,
  FaShopify,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { UserProducts } from "../../../api/collections/UserProducts";
import { Products } from "../../../api/collections/products";
import { Stores } from "../../../api/collections/stores";

const MyProducts = () => {
  // Fetch user products from database
  const { products, productsLoading, baseProducts, shopifyStores } = useTracker(() => {
    const userProductsHandle = Meteor.subscribe("userProducts.mine");
    const productsHandle = Meteor.subscribe("products.all");
    const storesHandle = Meteor.subscribe("stores.mine");

    const userProducts = UserProducts.find({}).fetch();
    const allProducts = Products.find({}).fetch();
    const stores = Stores.find({ platform: 'shopify', status: 'active' }).fetch();

    // Map user products with base product info
    const mappedProducts = userProducts.map((up) => {
      const baseProduct = allProducts.find((p) => p._id === up.baseProductId);

      // Get first available preview image (front or back)
      let previewImage = null;
      if (up.previewImages && typeof up.previewImages === "object") {
        previewImage =
          up.previewImages.front ||
          up.previewImages.back ||
          Object.values(up.previewImages)[0];
      }

      return {
        id: up._id,
        name: up.name,
        baseProduct: baseProduct?.name || "Unknown Product",
        image:
          previewImage ||
          baseProduct?.productImage ||
          "/images/placeholder.png",
        previewImages: up.previewImages || {}, // Store all previews for modal
        price: up.price,
        status: up.status,
        sales: up.sales || 0,
        createdAt: up.createdAt,
        shopifyProducts: up.shopifyProducts || [], // Shopify sync status
      };
    });

    return {
      products: mappedProducts,
      productsLoading: !userProductsHandle.ready() || !productsHandle.ready() || !storesHandle.ready(),
      baseProducts: allProducts,
      shopifyStores: stores,
    };
  }, []);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedView, setSelectedView] = useState("front"); // For toggling between front/back in modal
  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [selectedProductForShopify, setSelectedProductForShopify] = useState(null);
  const [selectedStore, setSelectedStore] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const filteredProducts = products.filter((p) =>
    filterStatus === "all" ? true : p.status === filterStatus
  );

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      Meteor.call("userProducts.delete", productId, (error) => {
        if (error) {
          toast.error("Failed to delete product");
          console.error(error);
        } else {
          toast.success("Product deleted successfully!");
        }
      });
    }
  };

  const handleDuplicate = (productId) => {
    Meteor.call("userProducts.duplicate", productId, (error, newProductId) => {
      if (error) {
        toast.error("Failed to duplicate product");
        console.error(error);
      } else {
        toast.success("Product duplicated successfully!");
      }
    });
  };

  const toggleStatus = (productId) => {
    Meteor.call("userProducts.togglePublish", productId, (error, newStatus) => {
      if (error) {
        toast.error("Failed to update status");
        console.error(error);
      } else {
        toast.success("Product status updated!");
      }
    });
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setSelectedView("front"); // Reset to front view
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const openShopifyModal = (product) => {
    setSelectedProductForShopify(product);
    setShowShopifyModal(true);
    setSelectedStore(shopifyStores[0]?._id || "");
  };

  const closeShopifyModal = () => {
    setShowShopifyModal(false);
    setSelectedProductForShopify(null);
    setSelectedStore("");
  };

  const handlePublishToShopify = () => {
    if (!selectedStore) {
      toast.error("Please select a store");
      return;
    }

    setIsPublishing(true);

    Meteor.call(
      "products.syncToShopify",
      selectedProductForShopify.id,
      selectedStore,
      (error, result) => {
        setIsPublishing(false);

        if (error) {
          toast.error(`Failed to publish: ${error.message}`);
          console.error(error);
        } else {
          toast.success("Product published to Shopify successfully!");
          closeShopifyModal();
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-600 mt-2">
            Manage your custom products and designs
          </p>
        </div>
        <Link
          to="/dashboard/designs"
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
        >
          <FaPlus />
          Create New Product
        </Link>
      </div>

      {/* Loading State */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your products...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <p className="text-gray-600 text-sm mb-1">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <p className="text-gray-600 text-sm mb-1">Published</p>
              <p className="text-3xl font-bold text-primary-600">
                {products.filter((p) => p.status === "published").length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <p className="text-gray-600 text-sm mb-1">Drafts</p>
              <p className="text-3xl font-bold text-gray-600">
                {products.filter((p) => p.status === "draft").length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-6">
              <p className="text-gray-600 text-sm mb-1">Total Sales</p>
              <p className="text-3xl font-bold text-green-600">
                {products.reduce((sum, p) => sum + p.sales, 0)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-soft p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "all"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setFilterStatus("published")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "published"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Published (
                {products.filter((p) => p.status === "published").length})
              </button>
              <button
                onClick={() => setFilterStatus("draft")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "draft"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Drafts ({products.filter((p) => p.status === "draft").length})
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-soft p-12 text-center">
              <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first custom product to get started
              </p>
              <Link
                to="/dashboard/designs"
                className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
              >
                <FaPlus />
                Create Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative bg-gray-50 h-64 flex items-center justify-center p-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {product.baseProduct}
                    </p>

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {product.sales} sales
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Created {formatDate(product.createdAt)}
                    </p>

                    {/* Actions */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openProductDetails(product)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <FaEye />
                          View
                        </button>
                        <button
                          onClick={() => toggleStatus(product.id)}
                          className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                            product.status === "published"
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-primary-500 text-white hover:bg-primary-600"
                          }`}
                        >
                          {product.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                        >
                          <FaCopy />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                      
                      {/* Shopify Publish Button */}
                      {shopifyStores.length > 0 && (
                        <button
                          onClick={() => openShopifyModal(product)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
                        >
                          <FaShopify />
                          Publish to Shopify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product Details Modal */}
          {showModal && selectedProduct && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-xl text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Product Image - Toggle between views */}
                    <div className="bg-gray-50 rounded-xl flex flex-col items-center justify-center p-4">
                      {selectedProduct.previewImages &&
                      Object.keys(selectedProduct.previewImages).length > 0 ? (
                        <div className="space-y-4 w-full">
                          {/* View Toggle Buttons */}
                          {Object.keys(selectedProduct.previewImages).length >
                            1 && (
                            <div className="flex gap-2 justify-center">
                              {Object.keys(selectedProduct.previewImages).map(
                                (side) => (
                                  <button
                                    key={side}
                                    onClick={() => setSelectedView(side)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      selectedView === side
                                        ? "bg-primary-500 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                  >
                                    {side.charAt(0).toUpperCase() +
                                      side.slice(1)}{" "}
                                    Side
                                  </button>
                                )
                              )}
                            </div>
                          )}

                          {/* Current View Image */}
                          <img
                            src={
                              selectedProduct.previewImages[selectedView] ||
                              Object.values(selectedProduct.previewImages)[0]
                            }
                            alt={`${selectedProduct.name} - ${selectedView}`}
                            className="w-full h-96 object-contain"
                          />
                        </div>
                      ) : (
                        <img
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          className="w-full h-96 object-contain"
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                          Base Product
                        </h3>
                        <p className="text-gray-900">
                          {selectedProduct.baseProduct}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                          Price
                        </h3>
                        <p className="text-3xl font-bold text-primary-600">
                          {formatPrice(selectedProduct.price)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                          Status
                        </h3>
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                            selectedProduct.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedProduct.status === "published"
                            ? "Published"
                            : "Draft"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                          Sales
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedProduct.sales} units sold
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                          Created
                        </h3>
                        <p className="text-gray-900">
                          {formatDate(selectedProduct.createdAt)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                          onClick={() => {
                            closeModal();
                            window.location.href = `/dashboard/designs?edit=${selectedProduct.id}`;
                          }}
                          className="flex items-center justify-center gap-2 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold w-full"
                        >
                          <FaEdit />
                          Edit Design
                        </button>
                        <button
                          onClick={() => toggleStatus(selectedProduct.id)}
                          className={`py-3 rounded-lg transition-colors font-semibold ${
                            selectedProduct.status === "published"
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {selectedProduct.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shopify Store Selection Modal */}
          {showShopifyModal && selectedProductForShopify && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={closeShopifyModal}
            >
              <div
                className="bg-white rounded-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Publish to Shopify
                  </h2>
                  <button
                    onClick={closeShopifyModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-xl text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-2">
                      Product: <span className="font-semibold">{selectedProductForShopify.name}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Shopify Store
                    </label>
                    {shopifyStores.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">No Shopify stores connected</p>
                        <Link
                          to="/dashboard/stores"
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Connect a Shopify store
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {shopifyStores.map((store) => (
                          <option key={store._id} value={store._id}>
                            {store.name} ({store.platformStoreId})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={closeShopifyModal}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePublishToShopify}
                      disabled={isPublishing || !selectedStore}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isPublishing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <FaShopify />
                          Publish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyProducts;
