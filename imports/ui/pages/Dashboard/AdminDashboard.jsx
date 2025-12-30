import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import {
  FaUserFriends,
  FaShoppingCart,
  FaMoneyBillWave,
  FaStore,
  FaChartLine,
  FaSpin,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeStores: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    setLoading(true);
    Meteor.call("admin.getStats", (error, result) => {
      if (error) {
        console.error("Error fetching admin stats:", error);
      } else {
        setStats(result);
      }
      setLoading(false);
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl shadow-soft p-6 flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">
          {title}
        </p>
        <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-2xl text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          System overview and management statistics
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={FaUserFriends}
              color="bg-blue-500"
              subtext="Registered accounts"
            />
            <StatCard
              title="Active Stores"
              value={stats.activeStores}
              icon={FaStore}
              color="bg-purple-500"
              subtext="Connected shops"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={FaShoppingCart}
              color="bg-orange-500"
              subtext="All time orders"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={FaMoneyBillWave}
              color="bg-green-500"
              subtext="Gross sales"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaChartLine className="text-primary-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/dashboard/admin/users"
                  className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <FaUserFriends className="text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    Manage Users
                  </span>
                </Link>
                <Link
                  to="/dashboard/admin/products"
                  className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="mx-auto w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <FaShoppingCart className="text-purple-600" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    Manage Products
                  </span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6 flex flex-col justify-center items-center text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                System Health
              </h3>
              <div className="w-full bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">
                <p className="font-semibold">All Systems Operational</p>
                <p className="text-sm opacity-80 mt-1">
                  Database, API, and Queue active
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
