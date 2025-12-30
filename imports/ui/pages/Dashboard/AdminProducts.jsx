import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUpload,
  FaSave,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Products } from "../../../api/collections/products";
import PrintAreaEditor from "./components/PrintAreaEditor";
import { FaPencilRuler } from "react-icons/fa";

// Predefined product templates with mockups and print areas
const PRODUCT_TEMPLATES = {
  "t-shirt": {
    mockupUrl: "/images/mockups/tshirt-template.png", // Flat design template (front)
    mockupImages: {
      front: "/images/mockups/tshirt-template.png",
      back: "/images/mockups/tshirt-back-template.png",
    },
    printAreas: [
      { name: "front", width: 350, height: 490, x: 340, y: 250 },
      { name: "back", width: 350, height: 490, x: 340, y: 250 },
    ],
  },
  hoodie: {
    mockupUrl: "/images/mockups/hoodie-template.png", // Flat design template (front)
    mockupImages: {
      front: "/images/mockups/hoodie-template.png",
      back: "/images/mockups/hoodie-back-template.png",
    },
    printAreas: [
      { name: "front", width: 350, height: 450, x: 340, y: 270 },
      { name: "back", width: 350, height: 490, x: 340, y: 250 },
    ],
  },
  mug: {
    mockupUrl: "/images/mockups/mug-template.png", // Flat design template
    mockupImages: {
      "all-over": "/images/mockups/mug-template.png",
    },
    // Aligned with the 'Unrolled Print Area' rectangle in the new schematic
    printAreas: [{ name: "all-over", width: 800, height: 320, x: 112, y: 160 }],
  },
  "phone-case": {
    mockupUrl: "/images/mockups/phone-case-template.png", // Flat design template
    mockupImages: {
      back: "/images/mockups/phone-case-template.png",
    },
    printAreas: [{ name: "back", width: 300, height: 600, x: 360, y: 200 }],
  },
  poster: {
    mockupUrl: "/images/mockups/poster-template.png", // Flat design template
    mockupImages: {
      full: "/images/mockups/poster-template.png",
    },
    printAreas: [{ name: "full", width: 600, height: 800, x: 212, y: 112 }],
  },
};

const AdminProducts = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "t-shirt",
    basePrice: "",
    productImage: "", // Realistic product photo for catalog
    status: "active",
    printAreas: [{ name: "front", width: 350, height: 490, x: 340, y: 250 }],
  });

  const [visualEditorData, setVisualEditorData] = useState(null);

  // Fetch products from database
  const { products, loading } = useTracker(() => {
    const handle = Meteor.subscribe("products.all");
    return {
      products: Products.find({}).fetch(),
      loading: !handle.ready(),
    };
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    // Start with t-shirt template by default
    const template = PRODUCT_TEMPLATES["t-shirt"];
    setFormData({
      name: "",
      description: "",
      type: "t-shirt",
      basePrice: "",
      productImage: "", // Admin will upload this
      status: "active",
      printAreas: template.printAreas,
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const template =
      PRODUCT_TEMPLATES[product.type] || PRODUCT_TEMPLATES["t-shirt"];
    setFormData({
      name: product.name,
      description: product.description,
      type: product.type,
      basePrice: (product.basePrice / 100).toFixed(2),
      productImage: product.productImage || "",
      status: product.status,
      printAreas: product.printAreas || template.printAreas,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const template = PRODUCT_TEMPLATES[newType];

    setFormData((prev) => ({
      ...prev,
      type: newType,
      printAreas: template.printAreas,
    }));
  };

  const handlePrintAreaChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      printAreas: prev.printAreas.map((area, i) =>
        i === index ? { ...area, [field]: Number(value) || value } : area
      ),
    }));
  };

  const addPrintArea = () => {
    setFormData((prev) => ({
      ...prev,
      printAreas: [
        ...prev.printAreas,
        { name: "back", width: 500, height: 600, x: 150, y: 100 },
      ],
    }));
  };

  const removePrintArea = (index) => {
    setFormData((prev) => ({
      ...prev,
      printAreas: prev.printAreas.filter((_, i) => i !== index),
    }));
  };

  const openVisualEditor = (index) => {
    // Get the print area name (front, back, etc.)
    const printAreaName = formData.printAreas[index].name;
    const template = PRODUCT_TEMPLATES[formData.type];

    // Try to use the mockup image for this specific print area
    let imageUrl;

    // Priority 1: Check formData.mockupImages (if product has custom mockups)
    if (formData.mockupImages && formData.mockupImages[printAreaName]) {
      imageUrl = formData.mockupImages[printAreaName];
    }
    // Priority 2: Check template.mockupImages (predefined mockups for each print area)
    else if (template?.mockupImages && template.mockupImages[printAreaName]) {
      imageUrl = template.mockupImages[printAreaName];
    }
    // Priority 3: Fallback to template mockupUrl or product image
    else {
      imageUrl = template?.mockupUrl || formData.productImage;
    }

    setVisualEditorData({
      index,
      area: formData.printAreas[index],
      imageUrl,
    });
  };

  const handleVisualEditorSave = (newArea) => {
    setFormData((prev) => ({
      ...prev,
      printAreas: prev.printAreas.map((area, i) =>
        i === visualEditorData.index ? { ...area, ...newArea } : area
      ),
    }));
    setVisualEditorData(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        productImage: reader.result,
      }));
      toast.success("Product image uploaded successfully!");
    };
    reader.onerror = () => {
      toast.error("Failed to upload image");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Get design mockup from template
    const template = PRODUCT_TEMPLATES[formData.type];

    const productData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      basePrice: Math.round(parseFloat(formData.basePrice) * 100),
      productImage: formData.productImage, // Realistic photo for catalog
      designMockup: template.mockupUrl, // Flat template for design studio
      mockupImages: template.mockupImages, // Mockup images for each print area
      mockupDimensions: { width: 1024, height: 1024 }, // Standard mockup size
      status: formData.status,
      printAreas: formData.printAreas,
    };

    if (editingProduct) {
      // Update existing product
      Meteor.call(
        "products.update",
        editingProduct._id,
        productData,
        (error) => {
          if (error) {
            toast.error("Failed to update product");
            console.error(error);
          } else {
            toast.success("Product updated successfully!");
            closeModal();
          }
        }
      );
    } else {
      // Create new product
      Meteor.call("products.create", productData, (error) => {
        if (error) {
          toast.error("Failed to create product");
          console.error(error);
        } else {
          toast.success("Product created successfully!");
          closeModal();
        }
      });
    }
  };

  const handleDelete = (productId, productName) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      Meteor.call("products.delete", productId, (error) => {
        if (error) {
          toast.error("Failed to delete product");
          console.error(error);
        } else {
          toast.success("Product deleted successfully!");
        }
      });
    }
  };

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage base products for your catalog
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
        >
          <FaPlus />
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-soft">
          <p className="text-gray-500 text-lg">No products yet</p>
          <p className="text-gray-400 mt-2">
            Create your first product to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="bg-gray-50 h-48 flex items-center justify-center p-4">
                {product.productImage ? (
                  <img
                    src={product.productImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <p>No image</p>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">
                      {product.type}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">
                      {formatPrice(product.basePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-medium ${
                        product.status === "active"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Print Areas:</span>
                    <span className="font-medium">
                      {product.printAreas?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id, product.name)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Classic T-Shirt"
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
                    placeholder="Describe the product..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleTypeChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="t-shirt">T-Shirt</option>
                      <option value="hoodie">Hoodie</option>
                      <option value="mug">Mug</option>
                      <option value="phone-case">Phone Case</option>
                      <option value="poster">Poster</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Mockup and print areas will be set automatically
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price ($) *
                    </label>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="15.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Design Template Preview - Show First */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Design Template (Auto-configured)
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Template for Design Studio
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    This flat template is automatically selected based on
                    product type. Customers will use this to place their
                    designs.
                  </p>
                  {PRODUCT_TEMPLATES[formData.type]?.mockupUrl && (
                    <img
                      src={PRODUCT_TEMPLATES[formData.type].mockupUrl}
                      alt="Design Template"
                      className="max-h-64 mx-auto object-contain border border-blue-300 rounded bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Product Catalog Photo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Product Catalog Photo *
                </h3>
                <p className="text-sm text-gray-600">
                  Upload a realistic product photo for the catalog (e.g., person
                  wearing t-shirt, mug on desk, etc.)
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Product Photo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex flex-col items-center px-4 py-6 bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                      <FaUpload className="text-3xl text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to upload product photo
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        required={!editingProduct && !formData.productImage}
                      />
                    </label>
                  </div>
                </div>

                {formData.productImage && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Product Photo Preview:
                    </p>
                    <img
                      src={formData.productImage}
                      alt="Product Preview"
                      className="max-h-48 mx-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Print Areas Info (Read-only) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Print Areas (Auto-configured)
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  {formData.printAreas.map((area, index) => (
                    <div
                      key={index}
                      className="pb-3 last:pb-0 border-b last:border-b-0 border-gray-300"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {area.name.charAt(0).toUpperCase() + area.name.slice(1)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Size: {area.width}×{area.height}px | Position: ({area.x}
                        , {area.y})
                      </p>
                      <button
                        type="button"
                        onClick={() => openVisualEditor(index)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <FaPencilRuler />
                        Adjust Visually
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Print areas are automatically configured based on product
                  type.
                </p>
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
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                >
                  <FaSave />
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Visual Editor Modal */}
      {visualEditorData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PrintAreaEditor
              imageUrl={visualEditorData.imageUrl}
              initialArea={visualEditorData.area}
              onSave={handleVisualEditorSave}
              onCancel={() => setVisualEditorData(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
