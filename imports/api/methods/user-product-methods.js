import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { requireAuth } from '../../api/users/users';
import { UserProducts } from '../../api/collections/UserProducts';
import { Products } from '../../api/collections/products';

Meteor.methods({
    /**
     * Create a new user product
     */
    async 'userProducts.create'(productData) {
        check(productData, {
            name: String,
            description: String,
            baseProductId: String,
            designData: Object,
            previewImages: Object,
            price: Number
        });

        const userId = requireAuth.call(this);

        // Calculate storage size (mockups + design data)
        const designDataSize = JSON.stringify(productData.designData).length;
        const previewImagesSize = Object.values(productData.previewImages).reduce((acc, imgStr) => acc + (imgStr ? imgStr.length : 0), 0);
        const totalSizeByte = designDataSize + previewImagesSize;
        const totalSizeMB = totalSizeByte / (1024 * 1024);

        // Check subscription limits
        const { Subscriptions } = await import('../../api/collections/subscriptions');
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });
        
        if (subscription) {
            const { limits, usage } = subscription;

            // Check Product Limit
            if (limits.maxProducts !== -1 && usage.productsCreated >= limits.maxProducts) {
                 throw new Meteor.Error('limit-reached', 'You have reached your product limit. Please upgrade your plan.');
            }

            // Check Storage Limit
            if (limits.maxStorageMB !== -1 && (usage.storageUsedMB + totalSizeMB) > limits.maxStorageMB) {
                throw new Meteor.Error('limit-reached', 'Storage limit exceeded (Product design is too large). Please upgrade your plan.');
            }
        }

        // Verify base product exists
        const baseProduct = await Products.findOneAsync(productData.baseProductId);
        if (!baseProduct) {
            throw new Meteor.Error('not-found', 'Base product not found');
        }

        const userProductId = await UserProducts.insertAsync({
            ...productData,
            userId,
            status: 'draft',
            sales: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            storageSize: totalSizeByte // Store size for future reference
        });

        // Increment usage
        if (subscription) {
            await Subscriptions.updateAsync(subscription._id, {
                $inc: { 
                    'usage.productsCreated': 1,
                    'usage.storageUsedMB': totalSizeMB
                }
            });
        }

        return userProductId;
    },

    /**
     * Get user products
     */
    async 'userProducts.list'() {
        const userId = requireAuth.call(this);
        return await UserProducts.find({ userId }).fetchAsync();
    },

    /**
     * Get single user product
     */
    async 'userProducts.getById'(id) {
        check(id, String);
        const userId = requireAuth.call(this);
        
        const product = await UserProducts.findOneAsync({ _id: id, userId });
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }
        return product;
    },

    /**
     * Update user product
     */
    async 'userProducts.update'(id, updates) {
        check(id, String);
        check(updates, Object);

        const userId = requireAuth.call(this);

        const product = await UserProducts.findOneAsync({ _id: id, userId });
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        // Calculate new size if design/previews changed
        let sizeDiffMB = 0;
        let newTotalSizeBytes = product.storageSize || 0;

        if (updates.designData || updates.previewImages) {
            const oldSize = product.storageSize || 0;
            
            const designData = updates.designData || product.designData;
            const previewImages = updates.previewImages || product.previewImages;

            const designDataSize = JSON.stringify(designData).length;
            const previewImagesSize = Object.values(previewImages).reduce((acc, imgStr) => acc + (imgStr ? imgStr.length : 0), 0);
            newTotalSizeBytes = designDataSize + previewImagesSize;

            const sizeDiffBytes = newTotalSizeBytes - oldSize;
            sizeDiffMB = sizeDiffBytes / (1024 * 1024);
        }

        // Check storage limit if size is increasing
        const { Subscriptions } = await import('../../api/collections/subscriptions');
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });

        if (subscription && sizeDiffMB > 0) {
             const { limits, usage } = subscription;
             if (limits.maxStorageMB !== -1 && (usage.storageUsedMB + sizeDiffMB) > limits.maxStorageMB) {
                throw new Meteor.Error('limit-reached', 'Storage limit exceeded. Cannot update product.');
            }
        }

        await UserProducts.updateAsync(id, {
            $set: {
                ...updates,
                storageSize: newTotalSizeBytes,
                updatedAt: new Date()
            }
        });

        // Update usage if size changed
        if (subscription && Math.abs(sizeDiffMB) > 0) {
             await Subscriptions.updateAsync(subscription._id, {
                $inc: { 'usage.storageUsedMB': sizeDiffMB }
            });
        }

        return true;
    },

    /**
     * Delete user product
     */
    async 'userProducts.delete'(productId) {
        check(productId, String);

        // Verify product exists and belongs to user
        const product = await UserProducts.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }
        if (product.userId !== userId) {
            throw new Meteor.Error('not-authorized', 'You can only delete your own products');
        }

        // Delete product
        await UserProducts.removeAsync(productId);

        // Decrement usage
        const { Subscriptions } = await import('../../api/collections/subscriptions');
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });

        if (subscription && subscription.usage.productsCreated > 0) {
            await Subscriptions.updateAsync(subscription._id, {
                $inc: { 'usage.productsCreated': -1 }
            });
        }

        return { success: true };
    },

    /**
     * Duplicate a user product
     */
    async 'userProducts.duplicate'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);

        // Verify product exists and belongs to user
        const product = await UserProducts.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }
        if (product.userId !== userId) {
            throw new Meteor.Error('not-authorized', 'You can only duplicate your own products');
        }

        // Create duplicate
        const { _id, createdAt, updatedAt, sales, ...productData } = product;
        const newProductId = await UserProducts.insertAsync({
            ...productData,
            name: `${product.name} (Copy)`,
            status: 'draft',
            sales: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return newProductId;
    },

    /**
     * Toggle publish status of a user product
     */
    async 'userProducts.togglePublish'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);

        // Verify product exists and belongs to user
        const product = await UserProducts.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }
        if (product.userId !== userId) {
            throw new Meteor.Error('not-authorized', 'You can only modify your own products');
        }

        // Toggle status
        const newStatus = product.status === 'published' ? 'draft' : 'published';
        await UserProducts.updateAsync(productId, {
            $set: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        return newStatus;
    }
});
