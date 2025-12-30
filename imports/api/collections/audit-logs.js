import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { TimestampSchema, RegExPatterns } from '../schemas/common';

export const AuditLogs = new Mongo.Collection('auditLogs');

const AuditLogSchema = new SimpleSchema({
    // User Reference
    userId: {
        type: String,
        regEx: RegExPatterns.Id,
        optional: true
    },
    userEmail: {
        type: String,
        optional: true
    },

    // Action
    action: {
        type: String,
        max: 100
    },

    // Resource
    resourceType: {
        type: String,
        max: 50
    },
    resourceId: {
        type: String,
        optional: true
    },

    // Changes
    changes: {
        type: Object,
        blackbox: true,
        optional: true
    },

    // Request Information
    ipAddress: {
        type: String,
        optional: true
    },
    userAgent: {
        type: String,
        optional: true
    },

    // Store Context
    storeId: {
        type: String,
        regEx: RegExPatterns.Id,
        optional: true
    },

    // Status
    status: {
        type: String,
        allowedValues: ['success', 'failure'],
        defaultValue: 'success'
    },

    // Error Information
    errorMessage: {
        type: String,
        optional: true
    },

    // Metadata
    metadata: {
        type: Object,
        blackbox: true,
        optional: true
    },

    ...TimestampSchema
});


// Indexes
if (Meteor.isServer) {
    AuditLogs.rawCollection().createIndex({ userId: 1, createdAt: -1 });
    AuditLogs.rawCollection().createIndex({ resourceType: 1, resourceId: 1 });
    AuditLogs.rawCollection().createIndex({ action: 1, createdAt: -1 });
    AuditLogs.rawCollection().createIndex({ storeId: 1, createdAt: -1 });
    AuditLogs.rawCollection().createIndex({ createdAt: -1 });
}

export { AuditLogSchema };
