import React from "react";
import {
  FaBox,
  FaShoppingBag,
  FaDollarSign,
  FaChartLine,
} from "react-icons/fa";

const Overview = () => {
  const stats = [
    {
      label: "Total Orders",
      value: "0",
      icon: FaShoppingBag,
      color: "bg-blue-500",
    },
    { label: "Products", value: "0", icon: FaBox, color: "bg-green-500" },
    {
      label: "Revenue",
      value: "$0",
      icon: FaDollarSign,
      color: "bg-yellow-500",
    },
    { label: "Growth", value: "0%", icon: FaChartLine, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg`}>
                  <Icon className="text-2xl text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <p className="font-medium text-gray-900">Create Product</p>
            <p className="text-sm text-gray-600 mt-1">Start designing</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <p className="font-medium text-gray-900">Connect Store</p>
            <p className="text-sm text-gray-600 mt-1">Link your shop</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center">
            <p className="font-medium text-gray-900">Upload Design</p>
            <p className="text-sm text-gray-600 mt-1">Add artwork</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500">
          <p>No recent activity</p>
          <p className="text-sm mt-2">Start by creating your first product!</p>
        </div>
      </div>
    </div>
  );
};

export default Overview;
