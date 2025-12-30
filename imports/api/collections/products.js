import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const Products = new Mongo.Collection('products');

const ProductSchema = new SimpleSchema({
    // Basic Information
    name: {
        type: String,
        max: 200
    },
    description: {
        type: String,
        max: 2000,
        optional: true
    },

    // Product Type
    type: {
        type: String,
        allowedValues: ['t-shirt', 'hoodie', 'sweatshirt', 'mug', 'poster', 'canvas', 'phone-case', 'tote-bag', 'pillow']
    },

    // Print Provider
    printProviderId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Print Areas Configuration
    printAreas: {
        type: Array,
        minCount: 1
    },
    'printAreas.$': {
        type: Object
    },
    'printAreas.$.name': {
        type: String,
        allowedValues: ['front', 'back', 'left-sleeve', 'right-sleeve', 'all-over']
    },
    'printAreas.$.width': {
        type: Number,
        min: 0
    },
    'printAreas.$.height': {
        type: Number,
        min: 0
    },
    'printAreas.$.x': {
        type: Number,
        defaultValue: 0
    },
    'printAreas.$.y': {
        type: Number,
        defaultValue: 0
    },

    // Dimensions (in inches)
    dimensions: {
        type: Object,
        optional: true
    },
    'dimensions.width': {
        type: Number,
        optional: true
    },
    'dimensions.height': {
        type: Number,
        optional: true
    },
    'dimensions.depth': {
        type: Number,
        optional: true
    },

    // Base Pricing (in cents)
    basePrice: {
        type: Number,
        min: 0
    },

    // Specifications
    specifications: {
        type: Object,
        blackbox: true,
        optional: true
    },

    // Status
    status: {
        type: String,
        allowedValues: ['active', 'inactive', 'discontinued'],
        defaultValue: 'active'
    },

    // Mockup template URL (legacy)
    mockupTemplate: {
        type: String,
        optional: true
    },

    // Mockup images for different print areas
    mockupImages: {
        type: Object,
        blackbox: true,
        optional: true
    },

    // Mockup dimensions (width x height in pixels)
    mockupDimensions: {
        type: Object,
        optional: true
    },
    'mockupDimensions.width': {
        type: Number,
        optional: true
    },
    'mockupDimensions.height': {
        type: Number,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    Products.rawCollection().createIndex({ type: 1, status: 1 });
    Products.rawCollection().createIndex({ printProviderId: 1 });
}

export { ProductSchema };
