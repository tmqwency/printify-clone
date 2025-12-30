import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const PrintProviders = new Mongo.Collection('printProviders');

const ShippingMethodSchema = new SimpleSchema({
    id: {
        type: String
    },
    name: {
        type: String
    },
    description: {
        type: String,
        optional: true
    },
    estimatedDays: {
        type: Object
    },
    'estimatedDays.min': {
        type: Number
    },
    'estimatedDays.max': {
        type: Number
    },
    cost: {
        type: Number,
        min: 0
    }
});

const PricingRuleSchema = new SimpleSchema({
    productType: {
        type: String
    },
    basePrice: {
        type: Number,
        min: 0
    },
    variantModifiers: {
        type: Object,
        blackbox: true,
        optional: true
    }
});

const PrintProviderSchema = new SimpleSchema({
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
        regEx: RegExPatterns.Url,
        optional: true
    },

    // Supported Products
    supportedProducts: {
        type: Array
    },
    'supportedProducts.$': {
        type: String
    },

    // Pricing Rules
    pricingRules: {
        type: Array,
        optional: true
    },
    'pricingRules.$': {
        type: PricingRuleSchema
    },

    // Shipping Methods
    shippingMethods: {
        type: Array
    },
    'shippingMethods.$': {
        type: ShippingMethodSchema
    },

    // Regions Served (ISO country codes)
    regionsServed: {
        type: Array
    },
    'regionsServed.$': {
        type: String,
        regEx: /^[A-Z]{2}$/
    },

    // API Configuration
    apiConfig: {
        type: Object,
        blackbox: true,
        optional: true
    },

    // Provider Type
    providerType: {
        type: String,
        allowedValues: ['mock', 'real'],
        defaultValue: 'mock'
    },

    // Adapter Class Name
    adapterClass: {
        type: String,
        optional: true
    },

    // Status
    status: {
        type: String,
        allowedValues: ['active', 'inactive', 'maintenance'],
        defaultValue: 'active'
    },

    // Performance Metrics
    averageProductionTime: {
        type: Number,
        optional: true,
        min: 0
    },
    successRate: {
        type: Number,
        optional: true,
        min: 0,
        max: 100
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    PrintProviders.rawCollection().createIndex({ status: 1 });
    PrintProviders.rawCollection().createIndex({ supportedProducts: 1 });
}

export { PrintProviderSchema, ShippingMethodSchema, PricingRuleSchema };
