import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { UserProducts } from '../collections/UserProducts';
import { Stores } from '../collections/stores';
import { ShopifyAdapter } from '../../lib/adapters/shopify-adapter';

Meteor.methods({
    /**
     * Sync a user product to a Shopify store
     */
    async 'products.syncToShopify'(userProductId, storeId) {
        check(userProductId, String);
        check(storeId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        // Get the user product
        const userProduct = await UserProducts.findOneAsync({
            _id: userProductId,
            userId: this.userId
        });

        if (!userProduct) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        // Get the store
        const store = await Stores.findOneAsync({
            _id: storeId,
            userId: this.userId,
            platform: 'shopify',
            status: 'active'
        });

        if (!store) {
            throw new Meteor.Error('not-found', 'Store not found or not active');
        }

        try {
            // Initialize Shopify adapter
            const adapter = new ShopifyAdapter({
                apiKey: Meteor.settings.private.oauth.shopify.apiKey,
                apiSecret: Meteor.settings.private.oauth.shopify.apiSecret
            });

            // Sync product to Shopify
            const shopifyProductId = await adapter.syncProduct(
                userProduct,
                userProduct.variants || [],
                userProduct.design,
                store
            );

            // Update user product with Shopify product ID
            await UserProducts.updateAsync(userProductId, {
                $push: {
                    shopifyProducts: {
                        storeId: storeId,
                        shopifyProductId: shopifyProductId,
                        syncedAt: new Date(),
                        status: 'synced'
                    }
                }
            });

            console.log('✅ Product synced to Shopify:', shopifyProductId);

            return {
                success: true,
                shopifyProductId: shopifyProductId
            };

        } catch (error) {
            console.error('❌ Error syncing product to Shopify:', error);
            
            // Update with error status
            await UserProducts.updateAsync(userProductId, {
                $push: {
                    shopifyProducts: {
                        storeId: storeId,
                        shopifyProductId: null,
                        syncedAt: new Date(),
                        status: 'error',
                        error: error.message
                    }
                }
            });

            throw new Meteor.Error('sync-failed', error.message);
        }
    },

    /**
     * Update a product on Shopify
     */
    async 'products.updateOnShopify'(userProductId, storeId, updates) {
        check(userProductId, String);
        check(storeId, String);
        check(updates, Object);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        const userProduct = await UserProducts.findOneAsync({
            _id: userProductId,
            userId: this.userId
        });

        if (!userProduct) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        const store = await Stores.findOneAsync({
            _id: storeId,
            userId: this.userId,
            platform: 'shopify'
        });

        if (!store) {
            throw new Meteor.Error('not-found', 'Store not found');
        }

        // Find the Shopify product record
        const shopifyProduct = userProduct.shopifyProducts?.find(
            sp => sp.storeId === storeId && sp.status === 'synced'
        );

        if (!shopifyProduct) {
            throw new Meteor.Error('not-synced', 'Product not synced to this store');
        }

        try {
            const adapter = new ShopifyAdapter({
                apiKey: Meteor.settings.private.oauth.shopify.apiKey,
                apiSecret: Meteor.settings.private.oauth.shopify.apiSecret
            });

            await adapter.updateProduct(
                shopifyProduct.shopifyProductId,
                updates,
                store
            );

            // Update sync timestamp
            await UserProducts.updateAsync(
                {
                    _id: userProductId,
                    'shopifyProducts.storeId': storeId
                },
                {
                    $set: {
                        'shopifyProducts.$.syncedAt': new Date(),
                        'shopifyProducts.$.status': 'synced'
                    }
                }
            );

            return { success: true };

        } catch (error) {
            console.error('❌ Error updating product on Shopify:', error);
            throw new Meteor.Error('update-failed', error.message);
        }
    },

    /**
     * Remove a product from Shopify
     */
    async 'products.removeFromShopify'(userProductId, storeId) {
        check(userProductId, String);
        check(storeId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        const userProduct = await UserProducts.findOneAsync({
            _id: userProductId,
            userId: this.userId
        });

        if (!userProduct) {
            throw new Meteor.Error('not-found', 'Product not found');
        }

        const store = await Stores.findOneAsync({
            _id: storeId,
            userId: this.userId,
            platform: 'shopify'
        });

        if (!store) {
            throw new Meteor.Error('not-found', 'Store not found');
        }

        const shopifyProduct = userProduct.shopifyProducts?.find(
            sp => sp.storeId === storeId && sp.status === 'synced'
        );

        if (!shopifyProduct) {
            throw new Meteor.Error('not-synced', 'Product not synced to this store');
        }

        try {
            const adapter = new ShopifyAdapter({
                apiKey: Meteor.settings.private.oauth.shopify.apiKey,
                apiSecret: Meteor.settings.private.oauth.shopify.apiSecret
            });

            await adapter.deleteProduct(
                shopifyProduct.shopifyProductId,
                store
            );

            // Remove from shopifyProducts array
            await UserProducts.updateAsync(userProductId, {
                $pull: {
                    shopifyProducts: { storeId: storeId }
                }
            });

            return { success: true };

        } catch (error) {
            console.error('❌ Error removing product from Shopify:', error);
            throw new Meteor.Error('delete-failed', error.message);
        }
    }
});
