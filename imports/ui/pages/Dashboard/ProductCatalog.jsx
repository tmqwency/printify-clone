import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaTshirt,
  FaFilter,
  FaTimes,
  FaShoppingCart,
} from "react-icons/fa";

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const productTypes = [
    { value: "all", label: "All Products" },
    { value: "t-shirt", label: "T-Shirts" },
    { value: "hoodie", label: "Hoodies" },
    { value: "mug", label: "Mugs" },
    { value: "poster", label: "Posters" },
    { value: "phone-case", label: "Phone Cases" },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedType]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call("products.list", {}, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      setProducts(result || []);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((p) => p.type === selectedType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-gray-600 mt-2">
          Browse our collection of high-quality products
        </p>
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="md:w-64">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedType !== "all") && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-primary-900"
                >
                  <FaTimes />
                </button>
              </span>
            )}
            {selectedType !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Type:{" "}
                {productTypes.find((t) => t.value === selectedType)?.label}
                <button
                  onClick={() => setSelectedType("all")}
                  className="hover:text-primary-900"
                >
                  <FaTimes />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-soft p-6 animate-pulse"
            >
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-6 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <FaTshirt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Showing {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => openProductDetails(product)}
                className="bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Product Image */}
                <div className="bg-gray-50 h-48 flex items-center justify-center p-4">
                  <img
                    src={product.productImage || "/images/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(product.basePrice)}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {product.type.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                {/* Product Image */}
                <div className="bg-gray-50 rounded-xl h-96 flex items-center justify-center p-8">
                  <img
                    src={
                      selectedProduct.productImage || "/images/placeholder.png"
                    }
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Type
                    </h3>
                    <p className="text-gray-900 capitalize">
                      {selectedProduct.type.replace("-", " ")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Base Price
                    </h3>
                    <p className="text-3xl font-bold text-primary-600">
                      {formatPrice(selectedProduct.basePrice)}
                    </p>
                  </div>

                  {selectedProduct.printAreas &&
                    selectedProduct.printAreas.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                          Print Areas
                        </h3>
                        <div className="space-y-2">
                          {selectedProduct.printAreas.map((area, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-700 capitalize">
                                {area.name}
                              </span>
                              <span className="text-gray-600">
                                {area.width}" × {area.height}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <button
                    onClick={() => {
                      closeModal();
                      window.location.href = `/dashboard/design/${selectedProduct._id}`;
                    }}
                    className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <FaShoppingCart />
                    Start Designing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
