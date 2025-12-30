import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const Designs = new Mongo.Collection('designs');

const DesignSchema = new SimpleSchema({
    // Store Reference
    storeId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Owner
    userId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Design Information
    name: {
        type: String,
        max: 200
    },
    description: {
        type: String,
        max: 1000,
        optional: true
    },

    // File URLs
    originalFileUrl: {
        type: String,
        regEx: RegExPatterns.Url
    },
    processedFileUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },
    thumbnailUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },

    // File Information
    fileType: {
        type: String,
        allowedValues: ['png', 'svg', 'jpg', 'jpeg']
    },
    fileSize: {
        type: Number,
        min: 0
    },

    // Canvas State (fabric.js JSON)
    canvasState: {
        type: Object,
        blackbox: true,
        optional: true
    },

    // Print Areas Configuration
    printAreasConfig: {
        type: Array,
        optional: true
    },
    'printAreasConfig.$': {
        type: Object
    },
    'printAreasConfig.$.printArea': {
        type: String
    },
    'printAreasConfig.$.designUrl': {
        type: String,
        regEx: RegExPatterns.Url
    },
    'printAreasConfig.$.position': {
        type: Object
    },
    'printAreasConfig.$.position.x': {
        type: Number
    },
    'printAreasConfig.$.position.y': {
        type: Number
    },
    'printAreasConfig.$.scale': {
        type: Number,
        min: 0,
        defaultValue: 1
    },
    'printAreasConfig.$.rotation': {
        type: Number,
        defaultValue: 0
    },

    // DPI Validation
    dpi: {
        type: Number,
        optional: true
    },
    dpiValid: {
        type: Boolean,
        defaultValue: false
    },

    // Dimensions (in pixels)
    width: {
        type: Number,
        optional: true
    },
    height: {
        type: Number,
        optional: true
    },

    // Tags
    tags: {
        type: Array,
        optional: true
    },
    'tags.$': {
        type: String,
        max: 50
    },

    // Status
    status: {
        type: String,
        allowedValues: ['draft', 'ready', 'processing', 'failed'],
        defaultValue: 'draft'
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    Designs.rawCollection().createIndex({ storeId: 1, status: 1 });
    Designs.rawCollection().createIndex({ userId: 1 });
    Designs.rawCollection().createIndex({ tags: 1 });
}

export { DesignSchema };
