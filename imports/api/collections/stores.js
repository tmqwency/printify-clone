import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, createEnumValidator, StorePlatforms, RegExPatterns } from '../schemas/common';

export const Stores = new Mongo.Collection('stores');

const StoreSchema = new SimpleSchema({
    // Basic Information
    name: {
        type: String,
        max: 200
    },
    description: {
        type: String,
        max: 1000,
        optional: true
    },
    logo: {
        type: String,
        optional: true,
        regEx: RegExPatterns.Url
    },

    // Owner
    userId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Platform Integration
    platform: createEnumValidator(StorePlatforms),
    platformStoreId: {
        type: String,
        optional: true
    },
    platformStoreName: {
        type: String,
        optional: true
    },

    // OAuth Tokens (encrypted at application level)
    accessToken: {
        type: String,
        optional: true
    },
    refreshToken: {
        type: String,
        optional: true
    },
    tokenExpiresAt: {
        type: Date,
        optional: true
    },

    // API Keys for external access
    apiKey: {
        type: String,
        optional: true
    },
    apiSecret: {
        type: String,
        optional: true
    },

    // Subscription
    subscriptionId: {
        type: String,
        optional: true,
        regEx: RegExPatterns.Id
    },

    // Status
    status: {
        type: String,
        allowedValues: ['active', 'suspended', 'disconnected'],
        defaultValue: 'active'
    },

    // Settings
    settings: {
        type: Object,
        blackbox: true,
        optional: true
    },

    ...TimestampSchema
});

// Note: Schema validation is performed in Meteor methods
// The schema is exported for use in method validation

// Indexes
if (Meteor.isServer) {
    Stores.rawCollection().createIndex({ userId: 1 });
    Stores.rawCollection().createIndex({ apiKey: 1 }, { sparse: true });
    Stores.rawCollection().createIndex({ platformStoreId: 1, platform: 1 }, { sparse: true });
}

export { StoreSchema };

