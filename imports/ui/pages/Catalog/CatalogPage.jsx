import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import { FaSearch, FaTshirt, FaFilter } from "react-icons/fa";

const CatalogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Products", count: 900 },
    { id: "apparel", name: "Apparel", count: 250 },
    { id: "accessories", name: "Accessories", count: 180 },
    { id: "home-living", name: "Home & Living", count: 200 },
    { id: "stationery", name: "Stationery", count: 120 },
    { id: "bags", name: "Bags", count: 80 },
    { id: "phone-cases", name: "Phone Cases", count: 70 },
  ];

  const products = [
    {
      name: "Classic T-Shirt",
      category: "apparel",
      image: "/images/tshirt.png",
      price: "$12.50",
    },
    {
      name: "Ceramic Mug",
      category: "home-living",
      image: "/images/mug.png",
      price: "$8.99",
    },
    {
      name: "Phone Case",
      category: "phone-cases",
      image: "/images/phone-case.png",
      price: "$15.00",
    },
    {
      name: "Poster",
      category: "home-living",
      image: "/images/poster.png",
      price: "$9.99",
    },
    {
      name: "Hoodie",
      category: "apparel",
      image: "/images/tshirt.png",
      price: "$28.50",
    },
    {
      name: "Tote Bag",
      category: "bags",
      image: "/images/mug.png",
      price: "$12.00",
    },
  ];

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "all" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Product Catalog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse 900+ high-quality products ready for your designs
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Products */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Categories Sidebar */}
            <div className="lg:w-64">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-primary-50 text-primary-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{cat.name}</span>
                      <span className="text-sm text-gray-500">{cat.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {filteredProducts.length} products
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="bg-gray-50 p-8">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-primary-600 font-bold">
                        From {product.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CatalogPage;
