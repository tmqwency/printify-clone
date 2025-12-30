import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const Webhooks = new Mongo.Collection('webhooks');

const WebhookSchema = new SimpleSchema({
    // Store Reference
    storeId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Event Type
    eventType: {
        type: String,
        allowedValues: [
            'order.created',
            'order.updated',
            'order.shipped',
            'order.delivered',
            'order.failed',
            'order.cancelled',
            'product.created',
            'product.updated',
            'design.ready',
            'fulfillment.completed'
        ]
    },

    // Target URL
    url: {
        type: String,
        regEx: RegExPatterns.Url
    },

    // Secret for HMAC signature
    secret: {
        type: String
    },

    // Retry Configuration
    retryConfig: {
        type: Object
    },
    'retryConfig.maxAttempts': {
        type: Number,
        defaultValue: 5,
        min: 1,
        max: 10
    },
    'retryConfig.initialDelay': {
        type: Number,
        defaultValue: 1000,
        min: 100
    },
    'retryConfig.maxDelay': {
        type: Number,
        defaultValue: 60000
    },

    // Status
    status: {
        type: String,
        allowedValues: ['active', 'paused', 'failed'],
        defaultValue: 'active'
    },

    // Statistics
    stats: {
        type: Object,
        optional: true
    },
    'stats.totalDeliveries': {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    'stats.successfulDeliveries': {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    'stats.failedDeliveries': {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    'stats.lastDeliveryAt': {
        type: Date,
        optional: true
    },
    'stats.lastSuccessAt': {
        type: Date,
        optional: true
    },
    'stats.lastFailureAt': {
        type: Date,
        optional: true
    },

    // Description
    description: {
        type: String,
        max: 500,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    Webhooks.rawCollection().createIndex({ storeId: 1, eventType: 1 });
    Webhooks.rawCollection().createIndex({ status: 1 });
}

export { WebhookSchema };
