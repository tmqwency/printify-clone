import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { toast } from "react-toastify";
import {
  FaStore,
  FaPlus,
  FaShopify,
  FaWordpress,
  FaEtsy,
  FaGlobe,
  FaTrash,
  FaCog,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaCopy,
} from "react-icons/fa";

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedStoreForKeys, setSelectedStoreForKeys] = useState(null);

  const platforms = [
    {
      id: "shopify",
      name: "Shopify",
      icon: FaShopify,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Connect your Shopify store to sync products and orders",
      popular: true,
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      icon: FaWordpress,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Integrate with your WordPress WooCommerce store",
    },
    {
      id: "etsy",
      name: "Etsy",
      icon: FaEtsy,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Sell custom products on Etsy marketplace",
    },
    {
      id: "api",
      name: "Custom API",
      icon: FaGlobe,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Use our REST API for custom integrations",
    },
  ];

  useEffect(() => {
    fetchStores();
    
    // Check for OAuth success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success('Shopify store connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/stores');
    }
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call("stores.list", (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      setStores(result || []);
    } catch (error) {
      console.error("Failed to load stores:", error);
      // Set mock data for demo
      setStores([
        {
          _id: "1",
          name: "My Shopify Store",
          platform: "shopify",
          platformStoreName: "mystore.myshopify.com",
          status: "active",
          createdAt: new Date("2024-01-10"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStore = (platform) => {
    setSelectedPlatform(platform);
    setShowAddModal(true);
  };

  const handleCreateStore = async (formData) => {
    try {
      // For Shopify, initiate OAuth flow
      if (formData.platform === 'shopify') {
        const shop = formData.platformStoreName;
        const userId = Meteor.userId();
        
        if (!userId) {
          toast.error('You must be logged in to connect a store');
          return;
        }
        
        if (!shop) {
          toast.error('Please enter your Shopify store URL');
          return;
        }
        
        // Normalize shop domain
        const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
        
        console.log('Redirecting to Shopify OAuth for:', shopDomain);
        
        // Build Shopify authorization URL directly
        const clientId = '3552046940d16e8a0115d8fc3992bf03'; // From settings
        const scopes = 'read_products,write_products,read_orders,write_orders,read_fulfillments,write_fulfillments';
        const redirectUri = `${window.location.origin}/api/oauth/shopify/callback`;
        const state = `${userId}_${Date.now()}`; // Include userId in state
        
        const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
          `client_id=${clientId}&` +
          `scope=${scopes}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `state=${state}`;
        
        console.log('Authorization URL:', authUrl);
        
        // Redirect to Shopify authorization page
        window.location.href = authUrl;
        return;
      }

      // For other platforms, create store directly
      await new Promise((resolve, reject) => {
        Meteor.call("stores.create", formData, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      toast.success(`${selectedPlatform.name} store connected successfully!`);
      setShowAddModal(false);
      setSelectedPlatform(null);
      fetchStores();
    } catch (error) {
      toast.error("Failed to connect store. Please try again.");
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!confirm("Are you sure you want to disconnect this store?")) {
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        Meteor.call("stores.delete", storeId, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      toast.success("Store disconnected successfully");
      fetchStores();
    } catch (error) {
      toast.error("Failed to disconnect store");
    }
  };

  const getPlatformIcon = (platformId) => {
    const platform = platforms.find((p) => p.id === platformId);
    return platform || platforms[3]; // Default to API
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-600 mt-2">
            Connect and manage your online stores
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
        >
          <FaPlus />
          Add Store
        </button>
      </div>

      {/* Connected Stores */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <FaStore className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No stores connected
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your first store to start selling
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            <FaPlus />
            Add Your First Store
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {stores.map((store) => {
            const platform = getPlatformIcon(store.platform);
            const Icon = platform.icon;

            return (
              <div
                key={store._id}
                className="bg-white rounded-xl shadow-soft p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${platform.bgColor}`}>
                      <Icon className={`text-2xl ${platform.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {store.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {store.platformStoreName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.status === "active" ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-red-500" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  {store.platform === "api" ? (
                    <button
                      onClick={() => setSelectedStoreForKeys(store)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <FaKey />
                      Manage Keys
                    </button>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      <FaCog />
                      Settings
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteStore(store._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    <FaTrash />
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Platforms */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Platforms</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform) => {
            const Icon = platform.icon;

            return (
              <div
                key={platform.id}
                className={`bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                  platform.popular ? "ring-2 ring-primary-500" : ""
                }`}
                onClick={() => handleConnectStore(platform)}
              >
                {platform.popular && (
                  <div className="text-xs font-semibold text-primary-600 mb-2">
                    POPULAR
                  </div>
                )}
                <div
                  className={`inline-flex p-3 rounded-lg ${platform.bgColor} mb-4`}
                >
                  <Icon className={`text-2xl ${platform.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {platform.description}
                </p>
                <button className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm">
                  Connect
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <AddStoreModal
          platform={selectedPlatform}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPlatform(null);
          }}
          onCreate={handleCreateStore}
        />
      )}

      {/* API Keys Modal */}
      {selectedStoreForKeys && (
        <ApiKeysModal
          store={selectedStoreForKeys}
          onClose={() => setSelectedStoreForKeys(null)}
        />
      )}
    </div>
  );
};

// Add Store Modal Component
const AddStoreModal = ({ platform, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: "",
    platform: platform?.id || "shopify",
    platformStoreName: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const Icon = platform?.icon || FaStore;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`p-3 rounded-lg ${platform?.bgColor || "bg-gray-100"}`}
          >
            <Icon
              className={`text-2xl ${platform?.color || "text-gray-600"}`}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {platform?.id === "api"
                ? "Create API Integration"
                : `Connect ${platform?.name || "Store"}`}
            </h2>
            <p className="text-sm text-gray-600">
              {platform?.id === "api"
                ? "Name your integration"
                : "Enter your store details"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {platform?.id === "api" ? "Integration Name" : "Store Name"}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={
                platform?.id === "api" ? "My Custom App" : "My Awesome Store"
              }
            />
          </div>

          {platform?.id !== "api" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {platform?.id === "shopify" ? "Shopify Store URL" : "Store URL"}
              </label>
              <input
                type="text"
                required
                value={formData.platformStoreName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    platformStoreName: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={
                  platform?.id === "shopify"
                    ? "mystore.myshopify.com"
                    : "https://mystore.com"
                }
              />
            </div>
          )}

          {platform?.id !== "api" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> In production, you'll be redirected to{" "}
                {platform?.name} to authorize the connection.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-colors"
            >
              {platform?.id === "api" ? "Create Integration" : "Connect Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// API Keys Modal Component
const ApiKeysModal = ({ store, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(store.apiKey);
  const [apiSecret, setApiSecret] = useState(store.apiSecret);

  const handleGenerateKeys = async () => {
    if (
      apiKey &&
      !confirm("Generating new keys will revoke the existing ones. Continue?")
    )
      return;

    setLoading(true);
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call("auth.generateApiToken", store._id, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      setApiKey(result.apiKey);
      setApiSecret(result.apiSecret);
      toast.success("API Credentials generated successfully!");
    } catch (error) {
      toast.error(error.reason || "Failed to generate keys");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              API Credentials
            </h2>
            <p className="text-sm text-gray-600">
              Manage access for <strong>{store.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimesCircle className="text-2xl" />
          </button>
        </div>

        <div className="space-y-6">
          {!apiKey ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
              <FaKey className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No API keys generated yet.</p>
              <button
                onClick={handleGenerateKeys}
                disabled={loading}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 font-medium"
              >
                {loading ? "Generating..." : "Generate API Key"}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key (Public)
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-50 px-3 py-2 rounded border border-gray-300 text-sm font-mono break-all">
                      {apiKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(apiKey)}
                      className="px-3 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret (Keep Private)
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-50 px-3 py-2 rounded border border-gray-300 text-sm font-mono break-all">
                      {apiSecret || "************************"}
                    </code>
                    {apiSecret && (
                      <button
                        onClick={() => copyToClipboard(apiSecret)}
                        className="px-3 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <FaCopy />
                      </button>
                    )}
                  </div>
                  {!apiSecret && (
                    <p className="text-xs text-orange-600 mt-1">
                      Secret is hidden. Regenerate if lost.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">
                  How to use
                </h4>
                <p className="text-xs text-blue-800 font-mono mb-2">
                  Authorization: Bearer {apiKey}
                </p>
                <p className="text-xs text-blue-700">
                  Endpoint: {window.location.origin}/api/v1/products
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleGenerateKeys}
                  className="text-red-600 text-sm hover:underline font-medium"
                >
                  Regenerate Keys (Revokes Old Ones)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stores;
