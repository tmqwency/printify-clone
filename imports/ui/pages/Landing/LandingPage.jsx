import React from "react";
import { Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import {
  FaRocket,
  FaShoppingCart,
  FaPalette,
  FaChartLine,
} from "react-icons/fa";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(/images/hero-bg.png)",
            opacity: 0.15,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create and sell custom products
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            100% Free to use · 900+ High-Quality Products · Largest global print
            network
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/signup"
              className="bg-primary-500 text-white px-8 py-4 rounded-lg hover:bg-primary-600 font-semibold text-lg transition-colors shadow-lg"
            >
              Start for free
            </Link>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors">
              How it works
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required</p>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "T-Shirts", image: "/images/tshirt.png" },
              { name: "Mugs", image: "/images/mug.png" },
              { name: "Phone Cases", image: "/images/phone-case.png" },
              { name: "Posters", image: "/images/poster.png" },
            ].map((product, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-gray-50 rounded-xl p-8 mb-4 transition-all group-hover:shadow-lg group-hover:scale-105">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-contain"
                  />
                </div>
                <h3 className="text-center font-semibold text-gray-900">
                  {product.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <FaRocket className="text-3xl text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to start</h3>
              <p className="text-gray-600">
                Create your store in minutes and start selling immediately
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <FaShoppingCart className="text-3xl text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No inventory</h3>
              <p className="text-gray-600">
                We handle production and shipping for you
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <FaPalette className="text-3xl text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">900+ products</h3>
              <p className="text-gray-600">
                From apparel to home decor and accessories
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <FaChartLine className="text-3xl text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scale easily</h3>
              <p className="text-gray-600">Grow your business without limits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to start selling?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of entrepreneurs who trust Printify
          </p>
          <Link
            to="/signup"
            className="inline-block bg-primary-500 text-white px-8 py-4 rounded-lg hover:bg-primary-600 font-semibold text-lg transition-colors shadow-lg"
          >
            Create your store now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>© 2024 Printify Clone. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
