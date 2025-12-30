import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, createEnumValidator, OrderStatus, AddressSchema, RegExPatterns } from '../schemas/common';

export const Orders = new Mongo.Collection('orders');

const OrderSchema = new SimpleSchema({
    // Store Reference
    storeId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // External Order Reference
    externalOrderId: {
        type: String
    },
    externalOrderNumber: {
        type: String,
        optional: true
    },
    platform: {
        type: String
    },

    // Customer Information
    customerEmail: {
        type: String,
        regEx: RegExPatterns.Email
    },
    customerName: {
        type: String,
        max: 200
    },

    // Shipping Address
    shippingAddress: {
        type: AddressSchema
    },

    // Order Status
    status: createEnumValidator(OrderStatus),

    // Pricing (in cents)
    subtotal: {
        type: Number,
        min: 0
    },
    shippingCost: {
        type: Number,
        min: 0,
        defaultValue: 0
    },
    tax: {
        type: Number,
        min: 0,
        defaultValue: 0
    },
    total: {
        type: Number,
        min: 0
    },

    // Cost Breakdown
    productionCost: {
        type: Number,
        min: 0,
        optional: true
    },
    profit: {
        type: Number,
        optional: true
    },

    // Tracking
    trackingNumber: {
        type: String,
        optional: true
    },
    trackingUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },
    carrier: {
        type: String,
        optional: true
    },

    // Fulfillment
    estimatedDeliveryDate: {
        type: Date,
        optional: true
    },
    shippedAt: {
        type: Date,
        optional: true
    },
    deliveredAt: {
        type: Date,
        optional: true
    },

    // Notes
    notes: {
        type: String,
        max: 2000,
        optional: true
    },

    // Webhook Sync
    lastSyncedAt: {
        type: Date,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    Orders.rawCollection().createIndex({ storeId: 1, status: 1 });
    Orders.rawCollection().createIndex({ externalOrderId: 1, platform: 1 }, { unique: true });
    Orders.rawCollection().createIndex({ customerEmail: 1 });
    Orders.rawCollection().createIndex({ createdAt: -1 });
}

export { OrderSchema };
