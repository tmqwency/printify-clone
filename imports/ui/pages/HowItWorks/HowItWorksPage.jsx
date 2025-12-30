import React from "react";
import { Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import {
  FaShoppingCart,
  FaPalette,
  FaTruck,
  FaDollarSign,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";

const HowItWorksPage = () => {
  const steps = [
    {
      number: "01",
      title: "Create your product",
      description:
        "Choose from 900+ products and customize them with your designs using our easy-to-use design tools.",
      icon: FaPalette,
      color: "bg-blue-500",
    },
    {
      number: "02",
      title: "Connect your store",
      description:
        "Integrate with Shopify, Etsy, WooCommerce, or use our API. Your products sync automatically.",
      icon: FaShoppingCart,
      color: "bg-purple-500",
    },
    {
      number: "03",
      title: "Start selling",
      description:
        "We handle production, packaging, and shipping. You focus on growing your business.",
      icon: FaTruck,
      color: "bg-primary-500",
    },
  ];

  const benefits = [
    {
      title: "No Upfront Costs",
      description: "Start your business with zero inventory investment",
      icon: FaDollarSign,
    },
    {
      title: "Easy to Scale",
      description: "Grow from 1 to 10,000 orders without any hassle",
      icon: FaChartLine,
    },
    {
      title: "Quality Guaranteed",
      description: "Premium products with our quality promise",
      icon: FaCheckCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            How Printify Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Create and sell custom products online with our print-on-demand
            platform. No inventory, no upfront costs, no hassle.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-primary-500 text-white px-8 py-4 rounded-lg hover:bg-primary-600 font-semibold text-lg transition-colors shadow-lg"
          >
            Start for free
          </Link>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Three Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 ${step.color} rounded-full mb-6`}
                  >
                    <Icon className="text-3xl text-white" />
                  </div>
                  <div className="text-5xl font-bold text-gray-200 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video/Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            See It In Action
          </h2>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary-500 border-b-8 border-b-transparent ml-1"></div>
                </div>
                <p className="text-gray-600 font-medium">
                  Watch how Printify works
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose Printify?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-soft hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
                    <Icon className="text-2xl text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            900+ Products to Choose From
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            From apparel to home decor, phone cases to wall art - we have
            everything you need to start your print-on-demand business.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { name: "T-Shirts", image: "/images/tshirt.png" },
              { name: "Mugs", image: "/images/mug.png" },
              { name: "Phone Cases", image: "/images/phone-case.png" },
              { name: "Posters", image: "/images/poster.png" },
            ].map((product, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white rounded-xl p-8 mb-4 transition-all group-hover:shadow-lg group-hover:scale-105">
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
          <Link
            to="/catalog"
            className="inline-block border-2 border-primary-500 text-primary-500 px-8 py-3 rounded-lg hover:bg-primary-50 font-semibold transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of entrepreneurs who trust Printify to bring their
            ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-semibold text-lg transition-colors shadow-lg"
            >
              Create Your Store
            </Link>
            <Link
              to="/pricing"
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 font-semibold text-lg transition-colors"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-primary-100">
            No credit card required · Free forever
          </p>
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

export default HowItWorksPage;
