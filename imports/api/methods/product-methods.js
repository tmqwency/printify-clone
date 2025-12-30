import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { requireAuth, verifyStoreOwnership } from '../../api/users/users';
import { Products } from '../../api/collections/products';
import { ProductVariants } from '../../api/collections/product-variants';
import { AuditLogs } from '../../api/collections/audit-logs';

Meteor.methods({
    /**
     * Create a new product
     */
    async 'products.create'(productData) {
        check(productData, {
            name: String,
            description: String,
            type: String,
            printAreas: Array,
            basePrice: Number,
            productImage: Match.Optional(String),
            designMockup: Match.Optional(String),
            mockupImages: Match.Optional(Object),
            mockupDimensions: Match.Optional(Object),
            status: Match.Optional(String),
            printProviderId: Match.Optional(String),
        });

        const userId = requireAuth.call(this);
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Create product
        const productId = await Products.insertAsync({
            ...productData,
            status: productData.status || 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'product_created',
            resourceType: 'product',
            resourceId: productId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return productId;
    },

    /**
     * List all products
     */
    async 'products.list'(filters = {}) {
        const userId = requireAuth.call(this);

        const query = { status: 'active', ...filters };
        return await Products.find(query).fetchAsync();
    },

    /**
     * Get product details
     */
    async 'products.get'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);
        const product = await Products.findOneAsync(productId);

        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        return product;
    },

    /**
     * Update a product
     */
    async 'products.update'(productId, productData) {
        check(productId, String);
        check(productData, {
            name: String,
            description: String,
            type: String,
            printAreas: Array,
            basePrice: Number,
            productImage: Match.Optional(String),
            designMockup: Match.Optional(String),
            mockupImages: Match.Optional(Object),
            mockupDimensions: Match.Optional(Object),
            status: Match.Optional(String),
            printProviderId: Match.Optional(String),
        });

        const userId = requireAuth.call(this);
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Verify product exists
        const product = await Products.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        // Update product
        await Products.updateAsync(productId, {
            $set: {
                ...productData,
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'product_updated',
            resourceType: 'product',
            resourceId: productId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true };
    },

    /**
     * Delete a product
     */
    async 'products.delete'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Verify product exists
        const product = await Products.findOneAsync(productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        // Soft delete - set status to inactive
        await Products.updateAsync(productId, {
            $set: {
                status: 'deleted',
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'product_deleted',
            resourceType: 'product',
            resourceId: productId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true };
    },

    /**
     * Create product variant
     */
    async 'productVariants.create'(variantData) {
        check(variantData, {
            productId: String,
            size: String,
            color: String,
            colorHex: String,
            sku: String,
            priceModifier: Number
        });

        const userId = requireAuth.call(this);

        // Verify product exists
        const product = await Products.findOneAsync(variantData.productId);
        if (!product) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        // Create variant
        const variantId = await ProductVariants.insertAsync({
            ...variantData,
            status: 'active',
            inStock: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return variantId;
    },

    /**
     * List product variants
     */
    async 'productVariants.list'(productId) {
        check(productId, String);

        const userId = requireAuth.call(this);

        return await ProductVariants.find({
            productId,
            status: 'active'
        }).fetchAsync();
    }
});
