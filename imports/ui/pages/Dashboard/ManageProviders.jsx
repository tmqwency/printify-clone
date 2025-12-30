import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Providers } from "../../../api/collections/Providers";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaGlobe,
  FaBox,
  FaClock,
  FaStar,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManageProviders = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    location: {
      country: "",
      region: "",
      facilities: [""],
    },
    capabilities: {
      supportedProducts: [],
      maxDailyCapacity: 100,
      currentCapacity: 100,
    },
    pricing: {
      baseCost: 0,
      shippingRates: {
        domestic: 0,
        international: 0,
      },
    },
    performance: {
      avgProductionTime: 3,
      qualityRating: 5,
      onTimeRate: 95,
    },
    contact: {
      email: "",
      phone: "",
      website: "",
    },
  });

  // Fetch providers
  const { providers, providersLoading } = useTracker(() => {
    const handle = Meteor.subscribe("providers.all");

    return {
      providers: Providers.find({}, { sort: { name: 1 } }).fetch(),
      providersLoading: !handle.ready(),
    };
  }, []);

  const openModal = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData(provider);
    } else {
      setEditingProvider(null);
      setFormData({
        name: "",
        description: "",
        logo: "",
        location: {
          country: "",
          region: "",
          facilities: [""],
        },
        capabilities: {
          supportedProducts: [],
          maxDailyCapacity: 100,
          currentCapacity: 100,
        },
        pricing: {
          baseCost: 0,
          shippingRates: {
            domestic: 0,
            international: 0,
          },
        },
        performance: {
          avgProductionTime: 3,
          qualityRating: 5,
          onTimeRate: 95,
        },
        contact: {
          email: "",
          phone: "",
          website: "",
        },
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProvider(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = editingProvider ? "providers.update" : "providers.create";
    const args = editingProvider ? [editingProvider._id, formData] : [formData];

    Meteor.call(method, ...args, (error) => {
      if (error) {
        toast.error(
          `Failed to ${editingProvider ? "update" : "create"} provider`
        );
        console.error(error);
      } else {
        toast.success(
          `Provider ${editingProvider ? "updated" : "created"} successfully!`
        );
        closeModal();
      }
    });
  };

  const handleDelete = (providerId) => {
    if (!confirm("Are you sure you want to delete this provider?")) return;

    Meteor.call("providers.delete", providerId, (error) => {
      if (error) {
        toast.error("Failed to delete provider");
        console.error(error);
      } else {
        toast.success("Provider deleted successfully!");
      }
    });
  };

  const handleToggleStatus = (providerId) => {
    Meteor.call("providers.toggleStatus", providerId, (error, newStatus) => {
      if (error) {
        toast.error("Failed to toggle provider status");
        console.error(error);
      } else {
        toast.success(
          `Provider ${newStatus === "active" ? "activated" : "deactivated"}`
        );
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNestedChange = (path, value) => {
    const keys = path.split(".");
    const newFormData = { ...formData };
    let current = newFormData;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setFormData(newFormData);
  };

  const stats = {
    total: providers.length,
    active: providers.filter((p) => p.status === "active").length,
    inactive: providers.filter((p) => p.status === "inactive").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Providers</h1>
          <p className="text-gray-600 mt-2">
            Manage print providers and fulfillment partners
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
        >
          <FaPlus />
          Add Provider
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Total Providers</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-4">
          <p className="text-gray-600 text-sm mb-1">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Providers Grid */}
      {providersLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading providers...</p>
          </div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No providers yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add your first print provider to start managing fulfillment
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            <FaPlus />
            Add Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider._id}
              className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-shadow"
            >
              {/* Provider Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {provider.logo ? (
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <FaBox className="text-primary-600 text-xl" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{provider.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        provider.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {provider.status === "active" ? (
                        <FaToggleOn />
                      ) : (
                        <FaToggleOff />
                      )}
                      {provider.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {provider.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaGlobe className="text-primary-500" />
                  <span>
                    {provider.location.country}, {provider.location.region}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaClock className="text-primary-500" />
                  <span>{provider.performance.avgProductionTime} days avg</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaStar className="text-yellow-500" />
                  <span>{provider.performance.qualityRating}/5 rating</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleToggleStatus(provider._id)}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    provider.status === "active"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {provider.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => openModal(provider)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(provider._id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProvider ? "Edit Provider" : "Add New Provider"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Premium Print Co."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe the provider..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Location</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={(e) =>
                        handleNestedChange("location.country", e.target.value)
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="USA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region *
                    </label>
                    <input
                      type="text"
                      value={formData.location.region}
                      onChange={(e) =>
                        handleNestedChange("location.region", e.target.value)
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="California"
                    />
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Performance</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avg Production Time (days) *
                    </label>
                    <input
                      type="number"
                      value={formData.performance.avgProductionTime}
                      onChange={(e) =>
                        handleNestedChange(
                          "performance.avgProductionTime",
                          parseInt(e.target.value)
                        )
                      }
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Rating (1-5) *
                    </label>
                    <input
                      type="number"
                      value={formData.performance.qualityRating}
                      onChange={(e) =>
                        handleNestedChange(
                          "performance.qualityRating",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                      min="1"
                      max="5"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      On-Time Rate (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.performance.onTimeRate}
                      onChange={(e) =>
                        handleNestedChange(
                          "performance.onTimeRate",
                          parseInt(e.target.value)
                        )
                      }
                      required
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Pricing</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Cost ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.pricing.baseCost}
                      onChange={(e) =>
                        handleNestedChange(
                          "pricing.baseCost",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domestic Shipping ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.pricing.shippingRates.domestic}
                      onChange={(e) =>
                        handleNestedChange(
                          "pricing.shippingRates.domestic",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      International Shipping ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.pricing.shippingRates.international}
                      onChange={(e) =>
                        handleNestedChange(
                          "pricing.shippingRates.international",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Contact Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) =>
                      handleNestedChange("contact.email", e.target.value)
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="contact@provider.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.phone}
                      onChange={(e) =>
                        handleNestedChange("contact.phone", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.contact.website}
                      onChange={(e) =>
                        handleNestedChange("contact.website", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://provider.com"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                >
                  {editingProvider ? "Update Provider" : "Create Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProviders;
