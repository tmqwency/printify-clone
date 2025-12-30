import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, createEnumValidator, SubscriptionStatus, RegExPatterns } from '../schemas/common';

export const Subscriptions = new Mongo.Collection('subscriptions');

const SubscriptionSchema = new SimpleSchema({
    // Store Reference
    storeId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // User Reference
    userId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Stripe Subscription ID
    stripeSubscriptionId: {
        type: String,
        optional: true
    },
    stripeCustomerId: {
        type: String,
        optional: true
    },

    // Plan Tier
    planTier: {
        type: String,
        allowedValues: ['free', 'starter', 'pro', 'enterprise'],
        defaultValue: 'free'
    },

    // Usage Metrics
    usage: {
        type: Object
    },
    'usage.ordersThisMonth': {
        type: Number,
        defaultValue: 0,
        min: 0
    },
    'usage.productsCreated': {
        type: Number,
        defaultValue: 0,
        min: 0
    },
    'usage.apiCallsThisMonth': {
        type: Number,
        defaultValue: 0,
        min: 0
    },
    'usage.storageUsedMB': {
        type: Number,
        defaultValue: 0,
        min: 0
    },

    // Plan Limits
    limits: {
        type: Object
    },
    'limits.maxOrders': {
        type: Number,
        defaultValue: 10 // Free tier limit
    },
    'limits.maxProducts': {
        type: Number,
        defaultValue: 5
    },
    'limits.maxApiCalls': {
        type: Number,
        defaultValue: 1000
    },
    'limits.maxStorageMB': {
        type: Number,
        defaultValue: 100
    },

    // Billing
    billingCycle: {
        type: String,
        allowedValues: ['monthly', 'yearly'],
        defaultValue: 'monthly'
    },
    currentPeriodStart: {
        type: Date,
        optional: true
    },
    currentPeriodEnd: {
        type: Date,
        optional: true
    },

    // Status
    status: createEnumValidator(SubscriptionStatus),

    // Trial
    trialEndsAt: {
        type: Date,
        optional: true
    },

    // Cancellation
    cancelAtPeriodEnd: {
        type: Boolean,
        defaultValue: false
    },
    canceledAt: {
        type: Date,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    Subscriptions.rawCollection().createIndex({ storeId: 1 }, { unique: true });
    Subscriptions.rawCollection().createIndex({ userId: 1 });
    Subscriptions.rawCollection().createIndex({ stripeSubscriptionId: 1 }, { sparse: true });
    Subscriptions.rawCollection().createIndex({ status: 1, planTier: 1 });
}

export { SubscriptionSchema };
