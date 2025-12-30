import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { requireAuth, verifyStoreOwnership } from '../users/users';
import { Stores } from '../collections/stores';
import { Subscriptions } from '../collections/subscriptions';
import { AuditLogs } from '../collections/audit-logs';
import crypto from 'crypto';

Meteor.methods({
    /**
     * Create a new store
     */
    async 'stores.create'(storeData) {
        check(storeData, {
            name: String,
            description: Match.Optional(String),
            platform: String,
            platformStoreName: Match.Optional(String)
        });

        const userId = requireAuth.call(this);

        // Create store
        const storeId = await Stores.insertAsync({
            ...storeData,
            userId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Create free subscription for the store
        await Subscriptions.insertAsync({
            storeId,
            userId,
            planTier: 'free',
            status: 'active',
            usage: {
                ordersThisMonth: 0,
                productsCreated: 0,
                apiCallsThisMonth: 0,
                storageUsedMB: 0
            },
            limits: {
                maxOrders: 10,
                maxProducts: 5,
                maxApiCalls: 1000,
                maxStorageMB: 100
            },
            billingCycle: 'monthly',
            cancelAtPeriodEnd: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'store_created',
            resourceType: 'store',
            resourceId: storeId,
            storeId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return storeId;
    },

    /**
     * Update store information
     */
    async 'stores.update'(storeId, updates) {
        check(storeId, String);
        check(updates, {
            name: String,
            description: String
        });

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        await Stores.updateAsync(storeId, {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'store_updated',
            resourceType: 'store',
            resourceId: storeId,
            storeId,
            changes: updates,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Delete a store
     */
    async 'stores.delete'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        // Update status instead of deleting
        await Stores.updateAsync(storeId, {
            $set: {
                status: 'disconnected',
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'store_deleted',
            resourceType: 'store',
            resourceId: storeId,
            storeId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Get store details
     */
    async 'stores.get'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        const store = await verifyStoreOwnership(userId, storeId);

        return store;
    },

    /**
     * List user's stores
     */
    async 'stores.list'() {
        const userId = requireAuth.call(this);

        return await Stores.find({ userId, status: { $ne: 'disconnected' } }).fetchAsync();
    }
});
