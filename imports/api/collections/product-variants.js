import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const ProductVariants = new Mongo.Collection('productVariants');

const ProductVariantSchema = new SimpleSchema({
    // Parent Product
    productId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Variant Attributes
    size: {
        type: String,
        optional: true,
        allowedValues: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'One Size']
    },
    color: {
        type: String,
        optional: true
    },
    colorHex: {
        type: String,
        optional: true,
        regEx: /^#[0-9A-F]{6}$/i
    },
    material: {
        type: String,
        optional: true
    },

    // SKU
    sku: {
        type: String
    },

    // Provider Mapping
    providerVariantId: {
        type: String,
        optional: true
    },
    providerSku: {
        type: String,
        optional: true
    },

    // Pricing (in cents)
    priceModifier: {
        type: Number,
        defaultValue: 0
    },

    // Stock Status
    inStock: {
        type: Boolean,
        defaultValue: true
    },
    stockQuantity: {
        type: Number,
        optional: true,
        min: 0
    },

    // Weight (in grams)
    weight: {
        type: Number,
        optional: true,
        min: 0
    },

    // Images
    images: {
        type: Array,
        optional: true
    },
    'images.$': {
        type: String,
        regEx: RegExPatterns.Url
    },

    // Status
    status: {
        type: String,
        allowedValues: ['active', 'inactive'],
        defaultValue: 'active'
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    ProductVariants.rawCollection().createIndex({ productId: 1, status: 1 });
    ProductVariants.rawCollection().createIndex({ sku: 1 }, { unique: true });
    ProductVariants.rawCollection().createIndex({ providerVariantId: 1 }, { sparse: true });
}

export { ProductVariantSchema };
