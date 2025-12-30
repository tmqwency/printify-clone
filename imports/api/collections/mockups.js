import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const Mockups = new Mongo.Collection('mockups');

const MockupSchema = new SimpleSchema({
    // Design Reference
    designId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Product Variant Reference
    productVariantId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Store Reference
    storeId: {
        type: String,
        regEx: RegExPatterns.Id
    },

    // Mockup Image URL
    imageUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },

    // Thumbnail URL
    thumbnailUrl: {
        type: String,
        regEx: RegExPatterns.Url,
        optional: true
    },

    // Generation Parameters
    parameters: {
        type: Object,
        blackbox: true,
        optional: true
    },

    // Status
    status: {
        type: String,
        allowedValues: ['pending', 'processing', 'completed', 'failed'],
        defaultValue: 'pending'
    },

    // Error Information
    errorMessage: {
        type: String,
        optional: true
    },

    // Processing Time (ms)
    processingTime: {
        type: Number,
        optional: true,
        min: 0
    },

    // Generation Metadata
    generatedBy: {
        type: String,
        allowedValues: ['server', 'client'],
        defaultValue: 'server'
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    Mockups.rawCollection().createIndex({ designId: 1, productVariantId: 1 });
    Mockups.rawCollection().createIndex({ storeId: 1, status: 1 });
    Mockups.rawCollection().createIndex({ status: 1, createdAt: 1 });
}

export { MockupSchema };
