import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { FaUser, FaKey, FaBell, FaTrash, FaCopy, FaPlus } from "react-icons/fa";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [apiTokens, setApiTokens] = useState([
    {
      _id: "1",
      name: "Production API",
      key: "pk_live_1234567890abcdef",
      secret: "sk_live_************************",
      createdAt: new Date("2024-01-10"),
    },
  ]);

  const tabs = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "api", label: "API Tokens", icon: FaKey },
    { id: "notifications", label: "Notifications", icon: FaBell },
  ];

  const handleGenerateToken = async () => {
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call("auth.generateApiToken", "store-id", (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      toast.success("API token generated successfully!");
      setApiTokens([
        ...apiTokens,
        {
          _id: Date.now().toString(),
          name: "New API Token",
          key: result.apiKey,
          secret: result.apiSecret,
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      toast.error("Failed to generate API token");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-primary-600 border-b-2 border-primary-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.emails?.[0]?.address || ""}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.profile?.name || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-red-600">
                  Danger Zone
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                    <FaTrash />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Tokens Tab */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">API Tokens</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Use these tokens to authenticate API requests
                  </p>
                </div>
                <button
                  onClick={handleGenerateToken}
                  className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  <FaPlus />
                  Generate Token
                </button>
              </div>

              <div className="space-y-4">
                {apiTokens.map((token) => (
                  <div
                    key={token._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {token.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Created{" "}
                          {new Date(token.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="text-red-600 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          API Key
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
                            {token.key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(token.key)}
                            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          API Secret
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
                            {token.secret}
                          </code>
                          <button
                            onClick={() => copyToClipboard(token.secret)}
                            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  {
                    id: "orders",
                    label: "New Orders",
                    description: "Get notified when you receive a new order",
                  },
                  {
                    id: "fulfillment",
                    label: "Fulfillment Updates",
                    description: "Updates on order fulfillment status",
                  },
                  {
                    id: "billing",
                    label: "Billing & Payments",
                    description: "Invoices and payment confirmations",
                  },
                  {
                    id: "marketing",
                    label: "Marketing & Updates",
                    description: "Product updates and tips",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between py-3 border-b border-gray-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
