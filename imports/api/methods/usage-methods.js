import { Meteor } from 'meteor/meteor';
import { requireAuth } from '../../api/users/users';
import { Subscriptions } from '../../api/collections/subscriptions';
import { UserProducts } from '../../api/collections/UserProducts';
import { Orders } from '../../api/collections/orders';
import { Stores } from '../../api/collections/stores';

/**
 * Check usage thresholds and notify user if needed
 * @param {String} userId 
 */
export const checkAndNotifyThresholds = async (userId) => {
// ... (already replaced above, but need to remove fs require at top?)
// Wait, I put fs require inside syncUsage too.

// In syncUsage:
        // 1. Count Products
        const productsCount = await UserProducts.find({ userId, status: { $ne: 'deleted' } }).countAsync();

        // 2. Count Orders (for this month)
    try {
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });
        if (!subscription) return;

        const { limits, usage } = subscription;
        if (!limits || !usage) return;

        // Initialize warningsSent if missing
        const warningsSent = usage.warningsSent || { orders: false, products: false, storage: false };
        
        const metrics = [
            { id: 'orders', name: 'Orders', val: usage.ordersThisMonth || 0, max: limits.maxOrders },
            { id: 'products', name: 'Products', val: usage.productsCreated || 0, max: limits.maxProducts },
            { id: 'storage', name: 'Storage', val: usage.storageUsedMB || 0, max: limits.maxStorageMB }
        ];

        const updates = {};
        let needsUpdate = false;

        for (const m of metrics) {
            if (m.max === -1) continue; // Unlimited

            const percentage = m.val / m.max;
            const threshold = 0.75; // 75%
            const isOverThreshold = percentage >= threshold;
            const alreadyWarned = warningsSent[m.id] === true;

            if (isOverThreshold && !alreadyWarned) {
                 // 1. Send Notification
                 const { Notifications } = await import('/imports/api/collections/notifications');
                 await Notifications.insertAsync({
                    userId,
                    type: 'usage_limit_warning',
                    title: 'Usage Alert',
                    message: `Your ${m.name} usage is at ${Math.round(percentage * 100)}% of your plan limit.`,
                    data: { metric: m.id, current: m.val, max: m.max },
                    read: false,
                    createdAt: new Date()
                });

                // 2. Mark as warned
                updates[`usage.warningsSent.${m.id}`] = true;
                needsUpdate = true;
            } else if (!isOverThreshold && alreadyWarned) {
                // 3. Reset warning if usage drops below threshold (e.g. deletion)
                updates[`usage.warningsSent.${m.id}`] = false;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await Subscriptions.updateAsync(subscription._id, {
                $set: updates
            });
        }
    } catch (err) {
        console.error(`Error in checkAndNotifyThresholds: ${err.message}`);
    }
};

/**
 * Synchronize usage for a user
 * @param {String} userId
 */
export const syncSubscriptionUsage = async (userId) => {
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

    // 5. Check Thresholds (using reusable helper)
    await checkAndNotifyThresholds(userId);

    return {
        products: productsCount,
        orders: ordersCount,
        storage: storageUsedMB
    };
};

Meteor.methods({
    /**
     * Synchronize usage counters with actual data
     */
    async 'subscriptions.syncUsage'() {
        const userId = requireAuth.call(this);
        return await syncSubscriptionUsage(userId);
    }
});
