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
            previewImages: Match.Optional(Object),
            price: Number,
        });

        const userId = requireAuth.call(this);

        // Verify base product exists
        const baseProduct = await Products.findOneAsync(productData.baseProductId);
        if (!baseProduct) {
            throw new Meteor.Error('not-found', 'Base product not found');
        }

        // Create user product
        const productId = await UserProducts.insertAsync({
            ...productData,
            userId,
            status: 'draft',
            sales: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return productId;
    },

    /**
     * Update a user product
     */
    async 'userProducts.update'(productId, productData) {
        check(productId, String);
        check(productData, {
            name: String,
            description: String,
            designData: Object,
            previewImages: Match.Optional(Object),
        });

        const userId = requireAuth.call(this);

        // Verify product exists and belongs to user
        const product = await UserProducts.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }
        if (product.userId !== userId) {
            throw new Meteor.Error('not-authorized', 'You can only update your own products');
        }

        // Update product
        await UserProducts.updateAsync(productId, {
            $set: {
                ...productData,
                updatedAt: new Date()
            }
        });

        return { success: true };
    },

    /**
     * Get a user product by ID
     */
    async 'userProducts.getById'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);

        const product = await UserProducts.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }
        if (product.userId !== userId) {
            throw new Meteor.Error('not-authorized', 'You can only view your own products');
        }

        return product;
    },

    /**
     * Delete a user product
     */
    async 'userProducts.delete'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);

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
