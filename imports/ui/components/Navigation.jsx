import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const Navigation = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: "Catalog", path: "/catalog" },
    { label: "Pricing", path: "/pricing" },
    {
      label: "How it works",
      dropdown: [
        { label: "How Printify Works", path: "/how-it-works" },
        { label: "Print On Demand", path: "/print-on-demand" },
        { label: "Printify Quality Promise", path: "/quality" },
        { label: "What to Sell?", path: "/what-to-sell" },
      ],
    },
    {
      label: "Solutions",
      dropdown: [
        { label: "For Entrepreneurs", path: "/solutions/entrepreneurs" },
        { label: "For E-commerce", path: "/solutions/ecommerce" },
        { label: "For Enterprises", path: "/solutions/enterprises" },
      ],
    },
    {
      label: "Learn",
      dropdown: [
        { label: "Blog", path: "/blog" },
        { label: "Guides", path: "/guides" },
        { label: "FAQ", path: "/faq" },
        { label: "Help Center", path: "/help" },
      ],
    },
    {
      label: "Services",
      dropdown: [
        { label: "Printify Studio", path: "/services/studio" },
        { label: "Printify Express Delivery", path: "/services/express" },
        { label: "Transfer Products", path: "/services/transfer" },
      ],
    },
    {
      label: "Support",
      dropdown: [
        { label: "Help Center", path: "/support/help" },
        { label: "Contact Us", path: "/support/contact" },
        { label: "Status", path: "/support/status" },
      ],
    },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-500">
              Printify
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => item.dropdown && setActiveDropdown(index)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.dropdown ? (
                  <>
                    <button className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-primary-500 font-medium transition-colors">
                      {item.label}
                      <FaChevronDown className="text-xs" />
                    </button>
                    {activeDropdown === index && (
                      <div className="absolute left-0 mt-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 animate-fade-in">
                        {item.dropdown.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-500 transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className="px-4 py-2 text-gray-700 hover:text-primary-500 font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 font-medium transition-colors"
                >
                  Sign up for free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
