// Base schema definitions and utilities
import SimpleSchema from 'simpl-schema';

// Extend SimpleSchema with custom validators
SimpleSchema.extendOptions(['autoValue']);

// Common schema patterns
export const TimestampSchema = {
    createdAt: {
        type: Date,
        autoValue: function () {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return { $setOnInsert: new Date() };
            } else {
                this.unset();
            }
        }
    },
    updatedAt: {
        type: Date,
        autoValue: function () {
            return new Date();
        }
    }
};

export const AddressSchema = new SimpleSchema({
    firstName: {
        type: String,
        max: 100
    },
    lastName: {
        type: String,
        max: 100
    },
    address1: {
        type: String,
        max: 200
    },
    address2: {
        type: String,
        max: 200,
        optional: true
    },
    city: {
        type: String,
        max: 100
    },
    state: {
        type: String,
        max: 100,
        optional: true
    },
    zip: {
        type: String,
        max: 20
    },
    country: {
        type: String,
        max: 2, // ISO country code
        regEx: /^[A-Z]{2}$/
    },
    phone: {
        type: String,
        max: 20,
        optional: true
    }
});

// Status enums
export const OrderStatus = {
    CREATED: 'created',
    IN_PRODUCTION: 'in_production',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
};

export const FulfillmentStatus = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

export const SubscriptionStatus = {
    ACTIVE: 'active',
    PAST_DUE: 'past_due',
    CANCELLED: 'cancelled',
    TRIALING: 'trialing'
};

export const UserRoles = {
    MERCHANT: 'merchant',
    ADMIN: 'admin'
};

export const StorePlatforms = {
    SHOPIFY: 'shopify',
    ETSY: 'etsy',
    WOOCOMMERCE: 'woocommerce'
};

// Helper to validate enum values
export const createEnumValidator = (enumObj) => {
    const values = Object.values(enumObj);
    return {
        type: String,
        allowedValues: values
    };
};

// Custom RegEx patterns (since SimpleSchema.RegEx is not available in npm version)
export const RegExPatterns = {
    Id: /^[a-zA-Z0-9]{17}$/, // Meteor ID pattern
    Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    Url: /^https?:\/\/.+/,
    Domain: /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i
};
