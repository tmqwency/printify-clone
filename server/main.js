import { Meteor } from "meteor/meteor";

// Import methods
import "../imports/api/methods/product-methods";
import "../imports/api/methods/design-methods";
import "../imports/api/methods/user-product-methods";
import "../imports/api/methods/order-methods";
import "../imports/api/methods/store-methods";
import "../imports/api/methods/subscription-methods";
import "../imports/api/methods/admin-methods";
import "../imports/api/methods/auth-methods";
import "../imports/api/methods/stock-image-methods";
import "../imports/api/methods/provider-methods";
import "./reset-products"; // Admin method to reset products

// Import collections
import { Products } from "../imports/api/collections/products";
import "../imports/api/server/api-routes"; // Register REST API routes
import { UserProducts } from "../imports/api/collections/UserProducts";
import { Designs } from "../imports/api/collections/designs";
import { Orders } from "../imports/api/collections/orders";
import { Providers } from "../imports/api/collections/Providers";

// Publish collections
Meteor.publish("products.all", function () {
  return Products.find({ status: "active" });
});

Meteor.publish("userProducts.mine", function () {
  if (!this.userId) {
    return this.ready();
  }
  return UserProducts.find({ userId: this.userId });
});

Meteor.publish("designs.mine", function () {
  if (!this.userId) {
    return this.ready();
  }
  return Designs.find({ userId: this.userId });
});

// Publish orders for admin
Meteor.publish("orders.all", async function () {
  console.log("orders.all publication called, userId:", this.userId);

  if (!this.userId) {
    console.log("No userId, returning empty");
    return this.ready();
  }

  // Check if user is admin
  const user = await Meteor.users.findOneAsync(this.userId);
  console.log("User found:", !!user, "isAdmin:", user?.profile?.isAdmin);

  if (!user || !user.profile?.isAdmin) {
    console.log("User is not admin, returning empty");
    return this.ready();
  }

  const ordersCount = await Orders.find({}).countAsync();
  console.log("Publishing orders, count:", ordersCount);

  return Orders.find({}, { sort: { createdAt: -1 }, limit: 100 });
});

// Publish providers for admin
Meteor.publish("providers.all", async function () {
  if (!this.userId) {
    return this.ready();
  }

  // Check if user is admin
  const user = await Meteor.users.findOneAsync(this.userId);
  if (!user || !user.profile?.isAdmin) {
    return this.ready();
  }

  return Providers.find({}, { sort: { name: 1 } });
});

// Import user publications
import "./publications/users";
