import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { requireAuth, verifyStoreOwnership } from '../../api/users/users';
import { Designs } from '../../api/collections/designs';
import { Mockups } from '../../api/collections/mockups';
import { AuditLogs } from '../../api/collections/audit-logs';

Meteor.methods({
    /**
     * Create a new design
     */
    async 'designs.create'(designData) {
        check(designData, {
            storeId: String,
            name: String,
            fileType: String,
            originalFileUrl: String,
            fileSize: Number,
            width: Number,
            height: Number
        });

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, designData.storeId);

        // Check storage limits
        const { Subscriptions } = await import('../../api/collections/subscriptions');
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });
        
        const fileSizeMB = designData.fileSize / (1024 * 1024);

        if (subscription) {
            const { limits, usage } = subscription;
            // Check if adding this file would exceed the limit
            if (limits.maxStorageMB !== -1 && (usage.storageUsedMB + fileSizeMB) > limits.maxStorageMB) {
                throw new Meteor.Error('limit-reached', 'Storage limit exceeded. Please upgrade your plan or delete old designs.');
            }
        }

        // Create design
        const designId = await Designs.insertAsync({
            ...designData,
            userId,
            status: 'draft',
            dpiValid: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Increment storage usage
        if (subscription) {
            await Subscriptions.updateAsync(subscription._id, {
                $inc: { 'usage.storageUsedMB': fileSizeMB }
            });
        }

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'design_created',
            resourceType: 'design',
            resourceId: designId,
            storeId: designData.storeId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return designId;
    },

    /**
     * Update design canvas state
     */
    async 'designs.updateCanvas'(designId, canvasState) {
        check(designId, String);
        check(canvasState, Object);

        const userId = requireAuth.call(this);

        // Verify design ownership
        const design = await Designs.findOneAsync({ _id: designId, userId });
        if (!design) {
            throw new Meteor.Error('not-found', 'Design not found');
        }

        // Update canvas state
        await Designs.updateAsync(designId, {
            $set: {
                canvasState,
                updatedAt: new Date()
            }
        });

        return true;
    },

    /**
     * Mark design as ready
     */
    async 'designs.markReady'(designId) {
        check(designId, String);

        const userId = requireAuth.call(this);

        const design = await Designs.findOneAsync({ _id: designId, userId });
        if (!design) {
            throw new Meteor.Error('not-found', 'Design not found');
        }

        await Designs.updateAsync(designId, {
            $set: {
                status: 'ready',
                updatedAt: new Date()
            }
        });

        return true;
    },

    /**
     * List user's designs
     */
    async 'designs.list'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        return await Designs.find({
            storeId,
            userId,
            status: { $ne: 'failed' }
        }).fetchAsync();
    },

    /**
     * Generate mockup
     */
    async 'mockups.generate'(mockupData) {
        check(mockupData, {
            designId: String,
            productVariantId: String,
            storeId: String
        });

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, mockupData.storeId);

        // Create mockup job
        const mockupId = await Mockups.insertAsync({
            ...mockupData,
            status: 'pending',
            generatedBy: 'server',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // TODO: Queue mockup generation job
        // For now, just return the mockup ID
        // The actual generation will be handled by a background worker

        return mockupId;
    },

    /**
     * Get mockup status
     */
    async 'mockups.getStatus'(mockupId) {
        check(mockupId, String);

        const userId = requireAuth.call(this);

        const mockup = await Mockups.findOneAsync(mockupId);
        if (!mockup) {
            throw new Meteor.Error('not-found', 'Mockup not found');
        }

        return {
            status: mockup.status,
            imageUrl: mockup.imageUrl,
            errorMessage: mockup.errorMessage
        };
    },

    /**
     * Upload a design (simplified for user designs)
     */
    async 'designs.upload'(designData) {
        check(designData, {
            name: String,
            fileUrl: String,
            fileType: String,
            fileSize: Number
        });

        const userId = requireAuth.call(this);

        // Check storage limits
        const { Subscriptions } = await import('../../api/collections/subscriptions');
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });
        
        const fileSizeMB = designData.fileSize / (1024 * 1024);

        if (subscription) {
            const { limits, usage } = subscription;
            if (limits.maxStorageMB !== -1 && (usage.storageUsedMB + fileSizeMB) > limits.maxStorageMB) {
                throw new Meteor.Error('limit-reached', 'Storage limit exceeded. Please upgrade your plan or delete old designs.');
            }
        }

        const designId = await Designs.insertAsync({
            userId,
            name: designData.name,
            originalFileUrl: designData.fileUrl,
            fileType: designData.fileType,
            fileSize: designData.fileSize,
            status: 'ready',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Increment storage usage
        if (subscription) {
            await Subscriptions.updateAsync(subscription._id, {
                $inc: { 'usage.storageUsedMB': fileSizeMB }
            });
        }

        return designId;
    },

    /**
     * List user's designs (simplified)
     */
    async 'designs.listMy'() {
        const userId = requireAuth.call(this);

        return await Designs.find({
            userId,
            status: { $ne: 'failed' }
        }).fetchAsync();
    },

    /**
     * Delete a design
     */
    async 'designs.delete'(designId) {
        check(designId, String);

        const userId = requireAuth.call(this);

        const design = await Designs.findOneAsync({ _id: designId, userId });
        if (!design) {
            throw new Meteor.Error('not-found', 'Design not found');
        }

        // Decrement storage usage
        const fileSizeMB = (design.fileSize || 0) / (1024 * 1024);
        
        const { Subscriptions } = await import('../../api/collections/subscriptions');
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });

        if (subscription && fileSizeMB > 0) {
            // Ensure we don't go below 0
            const currentUsage = subscription.usage.storageUsedMB || 0;
            const newUsage = Math.max(0, currentUsage - fileSizeMB);
            
            await Subscriptions.updateAsync(subscription._id, {
                $set: { 'usage.storageUsedMB': newUsage }
            });
        }

        await Designs.removeAsync(designId);
        return true;
    }
});
