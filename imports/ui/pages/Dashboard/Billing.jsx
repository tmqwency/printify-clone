import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaCrown,
  FaRocket,
  FaBuilding,
  FaChartLine,
} from "react-icons/fa";

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      icon: FaRocket,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      features: [
        "10 orders per month",
        "5 products",
        "1,000 API calls",
        "100 MB storage",
        "Basic support",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      price: 29,
      icon: FaChartLine,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      popular: true,
      features: [
        "100 orders per month",
        "50 products",
        "10,000 API calls",
        "1 GB storage",
        "Priority support",
        "Advanced analytics",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 99,
      icon: FaCrown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      features: [
        "1,000 orders per month",
        "500 products",
        "100,000 API calls",
        "10 GB storage",
        "24/7 priority support",
        "Advanced analytics",
        "Custom branding",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 299,
      icon: FaBuilding,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
      features: [
        "Unlimited orders",
        "Unlimited products",
        "Unlimited API calls",
        "Unlimited storage",
        "Dedicated support",
        "Advanced analytics",
        "Custom branding",
        "White-label option",
      ],
    },
  ];

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      // Get current store (mock for now)
      const storeId = "mock-store-id";

      const [subData, usageData] = await Promise.all([
        new Promise((resolve, reject) => {
          Meteor.call("subscriptions.get", storeId, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        }),
        new Promise((resolve, reject) => {
          Meteor.call(
            "subscriptions.getUsageStats",
            storeId,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        }),
      ]);

      setSubscription(subData);
      setUsageStats(usageData);
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      // Set mock data for demo
      setSubscription({
        planTier: "free",
        status: "active",
      });
      setUsageStats({
        plan: "free",
        usage: {
          ordersThisMonth: 3,
          productsCreated: 2,
          apiCallsThisMonth: 150,
          storageUsedMB: 25,
        },
        limits: {
          maxOrders: 10,
          maxProducts: 5,
          maxApiCalls: 1000,
          maxStorageMB: 100,
        },
        percentages: {
          orders: 30,
          products: 40,
          apiCalls: 15,
          storage: 25,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    try {
      const storeId = "mock-store-id";
      await new Promise((resolve, reject) => {
        Meteor.call(
          "subscriptions.changePlan",
          storeId,
          selectedPlan,
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      toast.success(`Successfully upgraded to ${selectedPlan} plan!`);
      setShowUpgradeModal(false);
      fetchSubscriptionData();
    } catch (error) {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary-500";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-soft p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and view usage statistics
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-primary-100 text-sm uppercase tracking-wide">
              Current Plan
            </p>
            <h2 className="text-4xl font-bold mt-2 capitalize">
              {subscription?.planTier || "Free"}
            </h2>
            <p className="mt-2 text-primary-100">
              {subscription?.status === "active" ? "Active" : "Inactive"}
            </p>
          </div>
          {subscription?.planTier !== "enterprise" && (
            <button
              onClick={() => handleUpgrade("pro")}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-xl font-semibold mb-6">Usage This Month</h3>
          <div className="space-y-6">
            {/* Orders */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Orders</span>
                <span className="text-gray-600">
                  {usageStats.usage.ordersThisMonth} /{" "}
                  {usageStats.limits.maxOrders === -1
                    ? "∞"
                    : usageStats.limits.maxOrders}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    usageStats.percentages.orders
                  )}`}
                  style={{
                    width: `${Math.min(usageStats.percentages.orders, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Products */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Products</span>
                <span className="text-gray-600">
                  {usageStats.usage.productsCreated} /{" "}
                  {usageStats.limits.maxProducts === -1
                    ? "∞"
                    : usageStats.limits.maxProducts}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    usageStats.percentages.products
                  )}`}
                  style={{
                    width: `${Math.min(usageStats.percentages.products, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* API Calls */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">API Calls</span>
                <span className="text-gray-600">
                  {usageStats.usage.apiCallsThisMonth.toLocaleString()} /{" "}
                  {usageStats.limits.maxApiCalls === -1
                    ? "∞"
                    : usageStats.limits.maxApiCalls.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    usageStats.percentages.apiCalls
                  )}`}
                  style={{
                    width: `${Math.min(usageStats.percentages.apiCalls, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Storage</span>
                <span className="text-gray-600">
                  {usageStats.usage.storageUsedMB} MB /{" "}
                  {usageStats.limits.maxStorageMB === -1
                    ? "∞"
                    : `${usageStats.limits.maxStorageMB} MB`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(
                    usageStats.percentages.storage
                  )}`}
                  style={{
                    width: `${Math.min(usageStats.percentages.storage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-2xl font-bold mb-6">Available Plans</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.planTier === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-soft overflow-hidden ${
                  plan.popular ? "ring-2 ring-primary-500" : ""
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary-500 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <div
                    className={`inline-flex p-3 rounded-lg ${plan.bgColor} mb-4`}
                  >
                    <Icon className={`text-2xl ${plan.color}`} />
                  </div>
                  <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <FaCheck className="text-primary-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-primary-500 text-white hover:bg-primary-600"
                    }`}
                  >
                    {isCurrentPlan ? "Current Plan" : "Upgrade"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Confirm Upgrade</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to upgrade to the{" "}
              <span className="font-semibold capitalize">{selectedPlan}</span>{" "}
              plan?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
