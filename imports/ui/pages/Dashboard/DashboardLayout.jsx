import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { toast } from "react-toastify";
import {
  FaHome,
  FaBox,
  FaShoppingBag,
  FaStore,
  FaCreditCard,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserShield,
  FaChartLine,
  FaClipboardList,
  FaTruck,
} from "react-icons/fa";
import { useState } from "react";
import NotificationCenter from '../../components/NotificationCenter';

const DashboardLayout = () => {
  const { user, logout, isLoggingIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reactively check if user is admin
  const isAdmin = useTracker(() => {
    const currentUser = Meteor.user();
    return currentUser?.profile?.isAdmin === true;
  }, []);

  // Protect the route
  React.useEffect(() => {
    // Only redirect if we are done loading and strictly have no user
    if (!loading && !isLoggingIn && !user) {
      navigate("/login");
    }
  }, [loading, isLoggingIn, user, navigate]);

  // Check if current route is Design Studio
  const isDesignStudio = location.pathname.includes("/dashboard/design");

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const menuItems = [
    { path: "/dashboard", icon: FaHome, label: "Overview" },
    { path: "/dashboard/products", icon: FaBox, label: "Product Catalog" },
    { path: "/dashboard/my-products", icon: FaBox, label: "My Products" },
    { path: "/dashboard/orders", icon: FaShoppingBag, label: "Orders" },
    { path: "/dashboard/stores", icon: FaStore, label: "Stores" },
    { path: "/dashboard/billing", icon: FaCreditCard, label: "Billing" },
    { path: "/dashboard/settings", icon: FaCog, label: "Settings" },
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Show loading state while checking auth
  if (loading || isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - hide in design studio */}
      {!isDesignStudio && (
        <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  {sidebarOpen ? (
                    <FaTimes className="text-xl" />
                  ) : (
                    <FaBars className="text-xl" />
                  )}
                </button>

                {/* Logo */}
                <Link to="/" className="flex items-center ml-4 lg:ml-0">
                  <div className="text-2xl font-bold bg-primary-500 text-white rounded w-10 h-10 flex items-center justify-center">
                    <span className="-rotate-12">P</span>
                  </div>
                </Link>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <span className="text-sm text-gray-700">
                  {user?.emails?.[0]?.address || user?.profile?.name || "User"}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaSignOutAlt />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Sidebar - hide in design studio */}
      {!isDesignStudio && (
        <aside
          className={`fixed left-0 top-16 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-20 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <nav className="p-4 space-y-1">
            {isAdmin ? (
              // Admin Menu - Only admin items
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Panel
                </p>
                <Link
                  to="/dashboard/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive("/dashboard/admin") &&
                    location.pathname === "/dashboard/admin"
                      ? "bg-primary-50 text-primary-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FaChartLine className="text-lg" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/dashboard/admin/products"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive("/dashboard/admin/products")
                      ? "bg-primary-50 text-primary-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FaBox className="text-lg" />
                  <span>Manage Products</span>
                </Link>
                <Link
                  to="/dashboard/manage-orders"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive("/dashboard/manage-orders")
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FaClipboardList className="text-xl" />
                  <span>Manage Orders</span>
                </Link>
                <Link
                  to="/dashboard/manage-providers"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive("/dashboard/manage-providers")
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FaTruck className="text-xl" />
                  <span>Manage Providers</span>
                </Link>
                <Link
                  to="/dashboard/admin/users"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive("/dashboard/admin/users")
                      ? "bg-primary-50 text-primary-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FaUserShield className="text-lg" />
                  <span>Manage Users</span>
                </Link>
              </>
            ) : (
              // Regular User Menu
              <>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? "bg-primary-50 text-primary-600 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="text-lg" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </aside>
      )}

      {/* Main Content - adjust margin and padding based on design studio */}
      <main className={`${isDesignStudio ? "" : "lg:ml-64 pt-16"}`}>
        <div className={isDesignStudio ? "h-screen" : "p-6"}>
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile - hide in design studio */}
      {!isDesignStudio && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
