import React from "react";
import { Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import {
  FaRocket,
  FaShoppingCart,
  FaPalette,
  FaChartLine,
  FaCheck,
  FaArrowRight,
} from "react-icons/fa";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/50 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-blue-200/50 rounded-full blur-3xl opacity-30 delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-medium text-sm mb-8 animate-bounce delay-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Trusted by 2M+ merchants worldwide
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
            Create and sell <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              custom products
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
            100% Free to use · 900+ High-Quality Products · Largest global print network. 
            Start your business today with zero risk.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-primary-500/30 hover:-translate-y-1"
            >
              Start for free
              <FaArrowRight className="ml-2 text-sm" />
            </Link>
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white border-2 border-gray-100 text-gray-700 font-semibold text-lg hover:bg-gray-50 hover:border-gray-200 transition-all duration-300">
              How it works
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaCheck className="text-primary-500" /> No credit card required
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-primary-500" /> Free forever plan
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FaRocket,
                title: "Easy to start",
                desc: "Create your store in minutes and start selling immediately",
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              {
                icon: FaShoppingCart,
                title: "No inventory",
                desc: "We handle production and shipping for you automatically",
                color: "text-green-500",
                bg: "bg-green-50"
              },
              {
                icon: FaPalette,
                title: "900+ products",
                desc: "From apparel to home decor, find the perfect canvas",
                color: "text-purple-500",
                bg: "bg-purple-50"
              },
              {
                icon: FaChartLine,
                title: "Scale easily",
                desc: "Grow your business without limits or inventory costs",
                color: "text-orange-500",
                bg: "bg-orange-50"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`text-2xl ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Create your custom products
            </h2>
            <p className="text-xl text-gray-500">
              Easily add your designs to a wide range of quality products
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {[
              { name: "T-Shirts", image: "/images/tshirt.png", tag: "Best Seller" },
              { name: "Mugs", image: "/images/mug.png", tag: "Trending" },
              { name: "Phone Cases", image: "/images/phone-case.png", tag: "New" },
              { name: "Posters", image: "/images/poster.png", tag: "Popular" },
            ].map((product, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-gray-50 rounded-2xl p-8 mb-4 relative overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:bg-white group-hover:ring-2 group-hover:ring-primary-500/20">
                  {product.tag && (
                    <span className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                      {product.tag}
                    </span>
                  )}
                  <div className="aspect-[4/5] flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
                <h3 className="text-center text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/catalog" className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              View all products <FaArrowRight className="ml-2 text-sm" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900 -skew-y-2 origin-top-left transform scale-110" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to start selling?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who trust Printify to power their online businesses.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center bg-white text-primary-900 px-10 py-5 rounded-xl hover:bg-gray-50 font-bold text-lg transition-all shadow-xl hover:-translate-y-1"
          >
            Create your store now
          </Link>
          <p className="mt-6 text-primary-200 text-sm">
            Are you a large business? <a href="#" className="underline hover:text-white">Talk to sales</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400 text-sm">
            © 2024 Printify Clone. All rights reserved.
          </div>
          <div className="flex gap-6 text-gray-500">
            <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
