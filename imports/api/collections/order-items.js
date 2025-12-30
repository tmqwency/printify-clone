import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const OrderItems = new Mongo.Collection('orderItems');

const OrderItemSchema = new SimpleSchema({
    // Order Reference
    orderId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Product References
    productId: {
        type: String,
        regEx: RegExPatterns.Id
    },
    productVariantId: {
        type: String,
        regEx: RegExPatterns.Id
    },
    designId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Product Details (snapshot at time of order)
    productName: {
        type: String
    },
    variantName: {
        type: String
    },
    sku: {
        type: String
    },

    // Quantity
    quantity: {
        type: Number,
        min: 1
    },

    // Pricing (in cents)
    unitPrice: {
        type: Number,
        min: 0
    },
    totalPrice: {
        type: Number,
        min: 0
    },
    productionCost: {
        type: Number,
        min: 0,
        optional: true
    },

    // Print Provider Assignment
    printProviderId: {
        type: String,
        regEx: RegExPatterns.Id,
        optional: true
    },

    // Fulfillment Status
    fulfillmentStatus: {
        type: String,
        allowedValues: ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'],
        defaultValue: 'pending'
    },

    // Fulfillment Job Reference
    fulfillmentJobId: {
        type: String,
        regEx: RegExPatterns.Id,
        optional: true
    },

    // Mockup URL
    mockupUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },

    // Print-ready file URL
    printFileUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    OrderItems.rawCollection().createIndex({ orderId: 1 });
    OrderItems.rawCollection().createIndex({ fulfillmentStatus: 1 });
    OrderItems.rawCollection().createIndex({ printProviderId: 1 });
}

export { OrderItemSchema };
