import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, createEnumValidator, FulfillmentStatus, RegExPatterns } from '../schemas/common';

export const FulfillmentJobs = new Mongo.Collection('fulfillmentJobs');

const FulfillmentJobSchema = new SimpleSchema({
    // Order Item Reference
    orderItemId: {
        type: String,
        regEx: RegExPatterns.Id
    },
    orderId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Print Provider
    printProviderId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Job Status
    status: createEnumValidator(FulfillmentStatus),

    // Provider Order Reference
    providerOrderId: {
        type: String,
        optional: true
    },

    // Retry Logic
    retryCount: {
        type: Number,
        defaultValue: 0,
        min: 0
    },
    maxRetries: {
        type: Number,
        defaultValue: 5,
        min: 0
    },
    nextRetryAt: {
        type: Date,
        optional: true
    },

    // Error Tracking
    errors: {
        type: Array,
        optional: true
    },
    'errors.$': {
        type: Object
    },
    'errors.$.timestamp': {
        type: Date
    },
    'errors.$.message': {
        type: String
    },
    'errors.$.code': {
        type: String,
        optional: true
    },
    'errors.$.stack': {
        type: String,
        optional: true
    },

    // Tracking Information
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

    // Timestamps
    queuedAt: {
        type: Date,
        optional: true
    },
    startedAt: {
        type: Date,
        optional: true
    },
    completedAt: {
        type: Date,
        optional: true
    },
    failedAt: {
        type: Date,
        optional: true
    },

    // Provider Response
    providerResponse: {
        type: Object,
        blackbox: true,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    FulfillmentJobs.rawCollection().createIndex({ status: 1, nextRetryAt: 1 });
    FulfillmentJobs.rawCollection().createIndex({ orderItemId: 1 });
    FulfillmentJobs.rawCollection().createIndex({ orderId: 1 });
    FulfillmentJobs.rawCollection().createIndex({ printProviderId: 1, status: 1 });
}

export { FulfillmentJobSchema };
