import { Meteor } from 'meteor/meteor';
import { requireAuth } from '../../api/users/users';
import { Subscriptions } from '../../api/collections/subscriptions';
import { UserProducts } from '../../api/collections/UserProducts';
import { Orders } from '../../api/collections/orders';
import { Stores } from '../../api/collections/stores';

Meteor.methods({
    /**
     * Synchronize usage counters with actual data
     */
    async 'subscriptions.syncUsage'() {
        const userId = requireAuth.call(this);

        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });
        if (!subscription) {
            return;
        }

        // 1. Count Products
        const productsCount = await UserProducts.find({ userId, status: { $ne: 'deleted' } }).countAsync();

        // 2. Count Orders (for this month)
        // First get all user's stores
        const stores = await Stores.find({ userId }).fetchAsync();
        const storeIds = stores.map(s => s._id);
        
        // Calculate start of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const ordersCount = await Orders.find({
            storeId: { $in: storeIds },
            createdAt: { $gte: startOfMonth }
        }).countAsync();

        // 3. Calculate Storage Usage
        
        // A. Designs (uploaded files)
        const { Designs } = await import('../../api/collections/designs');
        const designs = await Designs.find({ userId }).fetchAsync();
        const designsSizeBytes = designs.reduce((acc, design) => acc + (design.fileSize || 0), 0);

        // B. User Products (mockups and design data)
        const products = await UserProducts.find({ userId }).fetchAsync();
        const productsSizeBytes = products.reduce((acc, product) => {
            // Use stored storageSize if available, otherwise calculate on fly
            if (product.storageSize) {
                return acc + product.storageSize;
            } else {
                // Approximate for legacy products
                const designDataSize = product.designData ? JSON.stringify(product.designData).length : 0;
                const previewImagesSize = product.previewImages ? Object.values(product.previewImages).reduce((a, s) => a + (s ? s.length : 0), 0) : 0;
                return acc + designDataSize + previewImagesSize;
            }
        }, 0);

        const totalSizeBytes = designsSizeBytes + productsSizeBytes;
        const storageUsedMB = totalSizeBytes / (1024 * 1024);

        // 4. Update Subscription
        await Subscriptions.updateAsync(subscription._id, {
            $set: {
                'usage.productsCreated': productsCount,
                'usage.ordersThisMonth': ordersCount,
                'usage.storageUsedMB': storageUsedMB,
                updatedAt: new Date()
            }
        });

        return {
            products: productsCount,
            orders: ordersCount,
            storage: storageUsedMB
        };
    }
});
