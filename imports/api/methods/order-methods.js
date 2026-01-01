import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { requireAuth, verifyStoreOwnership } from '/imports/api/users/users';
import { Orders } from '/imports/api/collections/orders';
import { OrderItems } from '/imports/api/collections/order-items';
import { FulfillmentJobs } from '/imports/api/collections/fulfillment-jobs';
import { Stores } from '/imports/api/collections/stores';
import { AuditLogs } from '/imports/api/collections/audit-logs';
import { IntegrationFactory } from '/imports/lib/adapters/integration-factory';
import { findBestProvider, calculateProviderCost } from '/imports/api/lib/provider-assignment';

Meteor.methods({
    /**
     * Process incoming order from platform
     */
    async 'orders.process'(orderData) {
        check(orderData, {
            storeId: String,
            externalOrderId: String,
            platform: String,
            customerEmail: String,
            customerName: String,
            shippingAddress: Object,
            items: Array
        });

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, orderData.storeId);

        // Check subscription limits
        const { Subscriptions } = await import('/imports/api/collections/subscriptions');
        // Find subscription by userId since it's linked to the user, not directly the store in schema yet
        // Assuming one subscription per user for all stores, or we need to look up owner of store if userId is not passed (but requireAuth is used)
        const subscription = await Subscriptions.findOneAsync({ userId }, { sort: { updatedAt: -1 } });

        if (subscription) {
            const { limits, usage } = subscription;
            if (limits.maxOrders !== -1 && usage.ordersThisMonth >= limits.maxOrders) {
                 // For automated orders we might want to log this failure instead of throwing, 
                 // but for now we block to protect resources
                throw new Meteor.Error('limit-reached', 'You have reached your monthly order limit. Please upgrade your plan.');
            }
        }

        // Check for duplicate order
        const existingOrder = await Orders.findOneAsync({
            storeId: orderData.storeId,
            externalOrderId: orderData.externalOrderId
        });

        if (existingOrder) {
            throw new Meteor.Error('duplicate-order', 'Order already exists');
        }

        // Create order
        const orderId = await Orders.insertAsync({
            storeId: orderData.storeId,
            externalOrderId: orderData.externalOrderId,
            platform: orderData.platform,
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            shippingAddress: orderData.shippingAddress,
            status: 'created',
            subtotal: 0,
            shippingCost: 0,
            tax: 0,
            total: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Create order items and calculate totals
        let subtotal = 0;
        const itemIds = [];

        for (const item of orderData.items) {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;

            const itemId = await OrderItems.insertAsync({
                orderId,
                productId: item.productId,
                productVariantId: item.variantId,
                designId: item.designId,
                productName: item.productName,
                variantName: item.variantName,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: itemTotal,
                fulfillmentStatus: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            itemIds.push(itemId);
        }

        // Update order totals
        const shippingCost = 500; // $5.00 default shipping
        const total = subtotal + shippingCost;

        // Auto-assign best provider
        const order = await Orders.findOneAsync(orderId);
        const bestProvider = await findBestProvider(order, 'balanced');

        let providerCost = 0;
        let assignedProviderId = null;

        if (bestProvider) {
            providerCost = calculateProviderCost(bestProvider, order); // local var name kept for logic
            assignedProviderId = bestProvider._id;
        }

        const profit = total - providerCost - shippingCost;

        await Orders.updateAsync(orderId, {
            $set: {
                subtotal,
                shippingCost,
                total,
                assignedProviderId,
                productionCost: providerCost, // Map to schema field
                profit, // Save profit
                assignmentMethod: 'auto',
                updatedAt: new Date()
            }
        });

        // Create fulfillment jobs for each item
        for (const itemId of itemIds) {
            await FulfillmentJobs.insertAsync({
                orderId,
                orderItemId: itemId,
                storeId: orderData.storeId,
                status: 'pending',
                attempts: 0,
                maxAttempts: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'order_created',
            resourceType: 'order',
            resourceId: orderId,
            storeId: orderData.storeId,
            metadata: { assignedProviderId, providerCost },
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Increment usage
        if (subscription) {
            await Subscriptions.updateAsync(subscription._id, {
                $inc: { 'usage.ordersThisMonth': 1 }
            });

            // Check thresholds
            const { checkAndNotifyThresholds } = await import('./usage-methods');
            await checkAndNotifyThresholds(userId);
        }

        // Notify user
        const { Notifications } = await import('/imports/api/collections/notifications');
        await Notifications.insertAsync({
            userId,
            type: 'order_created',
            title: 'New Order Received',
            message: `Order #${orderData.externalOrderId} from ${orderData.customerName} has been created.`,
            data: { orderId, externalOrderId: orderData.externalOrderId },
            read: false,
            createdAt: new Date()
        });

        return orderId;
    },

    /**
     * Get order status
     */
    async 'orders.getStatus'(orderId) {
        check(orderId, String);

        const userId = requireAuth.call(this);

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        await verifyStoreOwnership(userId, order.storeId);

        const items = await OrderItems.find({ orderId }).fetchAsync();
        const jobs = await FulfillmentJobs.find({ orderId }).fetchAsync();

        return {
            order,
            items,
            fulfillment: jobs
        };
    },

    /**
     * Cancel order
     */
    async 'orders.cancel'(orderId, reason) {
        check(orderId, String);
        check(reason, String);

        const userId = requireAuth.call(this);

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        await verifyStoreOwnership(userId, order.storeId);

        // Can only cancel if not yet fulfilled
        if (['fulfilled', 'shipped'].includes(order.status)) {
            throw new Meteor.Error('invalid-status', 'Cannot cancel fulfilled or shipped orders');
        }

        // Update order status
        await Orders.updateAsync(orderId, {
            $set: {
                status: 'cancelled',
                cancellationReason: reason,
                cancelledAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Cancel all fulfillment jobs
        await FulfillmentJobs.updateAsync(
            { orderId },
            {
                $set: {
                    status: 'cancelled',
                    updatedAt: new Date()
                }
            },
            { multi: true }
        );

        // Notify platform
        const store = await Stores.findOneAsync(order.storeId);
        if (store && store.platform !== 'api') {
            try {
                const adapter = IntegrationFactory.create(store.platform, {
                    accessToken: store.accessToken
                });

                if (adapter) {
                    await adapter.updateOrderStatus(order.externalOrderId, {
                        status: 'cancelled',
                        reason
                    });
                }
            } catch (error) {
                console.error('Failed to notify platform of cancellation:', error);
            }
        }

        return true;
    },

    /**
     * Update order tracking
     */
    async 'orders.updateTracking'(orderId, trackingData) {
        check(orderId, String);
        check(trackingData, {
            trackingNumber: String,
            trackingUrl: String,
            carrier: String
        });

        const userId = requireAuth.call(this);

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        // Check if user is admin
        const currentUser = await Meteor.users.findOneAsync(userId);
        const isAdmin = currentUser?.profile?.isAdmin;

        if (!isAdmin) {
             await verifyStoreOwnership(userId, order.storeId);
        }

        // Update order
        await Orders.updateAsync(orderId, {
            $set: {
                status: 'shipped',
                trackingNumber: trackingData.trackingNumber,
                trackingUrl: trackingData.trackingUrl,
                carrier: trackingData.carrier,
                shippedAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Update all items to shipped
        await OrderItems.updateAsync(
            { orderId },
            {
                $set: {
                    fulfillmentStatus: 'shipped',
                    updatedAt: new Date()
                }
            },
            { multi: true }
        );

        // Notify platform
        const store = await Stores.findOneAsync(order.storeId);
        if (store && store.platform !== 'api') {
            try {
                const adapter = IntegrationFactory.create(store.platform, {
                    accessToken: store.accessToken
                });

                if (adapter) {
                    await adapter.updateOrderStatus(order.externalOrderId, {
                        status: 'shipped',
                        trackingNumber: trackingData.trackingNumber,
                        trackingUrl: trackingData.trackingUrl
                    });
                }
            } catch (error) {
                console.error('Failed to notify platform of shipment:', error);
            }
        }
        
        // Notify user
        const { Notifications } = await import('/imports/api/collections/notifications');
        await Notifications.insertAsync({
            userId: order.userId, // CAUTION: order doesn't carry userId directly usually, it carries storeId. We need to find owner.
            // Actually, verifyStoreOwnership checks userId vs storeId owner. So we can use that if caller is owner.
            // BUT, caller is user. So notify SELF? Usually updateTracking is called by SYSTEM or ADMIN.
            // If caller is admin, we notify store owner.
            // Let's assume store owner logic.
           
            // RE-CHECK: verifyStoreOwnership(userId, order.storeId) implies the caller OWNS the store.
            // So if I update my own tracking, I get a notification? Seems redundant but okay.
            // If this is called by a webhook (unauthenticated or admin), we need to find the user.
            
            userId, // For now, notifying the caller (owner).
            type: 'order_status_change',
            title: 'Order Shipped',
            message: `Order #${order.externalOrderId} has been shipped via ${trackingData.carrier}.`,
            data: { orderId, externalOrderId: order.externalOrderId },
            read: false,
            createdAt: new Date()
        });

        return true;
    },

    /**
     * List user's orders across all stores
     */
    async 'orders.list'(filters = {}) {
        const userId = requireAuth.call(this);

        // Get all stores owned by the user
        const stores = await Stores.find({ userId, status: { $ne: 'disconnected' } }).fetchAsync();
        const storeIds = stores.map(store => store._id);

        if (storeIds.length === 0) {
            return [];
        }

        const query = { storeId: { $in: storeIds } };

        if (filters.status && filters.status !== 'all') {
            query.status = filters.status;
        }

        return await Orders.find(query, {
            sort: { createdAt: -1 }
        }).fetchAsync();
    },

    /**
     * List all orders (Admin only)
     */
    async 'orders.listAll'(filters = {}) {
        const userId = requireAuth.call(this);

        // Verify admin access
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const query = {};

        if (filters.status && filters.status !== 'all') {
            query.status = filters.status;
        }

        if (filters.search) {
            query.$or = [
                { externalOrderId: { $regex: filters.search, $options: 'i' } },
                { customerEmail: { $regex: filters.search, $options: 'i' } },
                { customerName: { $regex: filters.search, $options: 'i' } }
            ];
        }

        return await Orders.find(query, {
            sort: { createdAt: -1 },
            limit: filters.limit || 50
        }).fetchAsync();
    },

    /**
     * Update order status (Admin only)
     */
    async 'orders.updateStatus'(orderId, newStatus) {
        check(orderId, String);
        check(newStatus, String);

        const userId = requireAuth.call(this);

        // Verify admin access
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        // Validate status transition
        const validStatuses = ['created', 'processing', 'fulfilled', 'shipped', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            throw new Meteor.Error('invalid-status', 'Invalid order status');
        }

        // Update order
        await Orders.updateAsync(orderId, {
            $set: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        // Update order items status
        if (newStatus === 'fulfilled') {
            await OrderItems.updateAsync(
                { orderId },
                {
                    $set: {
                        fulfillmentStatus: 'fulfilled',
                        updatedAt: new Date()
                    }
                },
                { multi: true }
            );
        }

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'order_status_updated',
            resourceType: 'order',
            resourceId: orderId,
            metadata: { oldStatus: order.status, newStatus },
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Notify Store Owner
        const { Stores } = await import('/imports/api/collections/stores');
        const store = await Stores.findOneAsync(order.storeId);
        if (store) {
            const { Notifications } = await import('/imports/api/collections/notifications');
            await Notifications.insertAsync({
                userId: store.userId, // Notify the store owner
                type: 'order_status_change',
                title: 'Order Status Updated',
                message: `Order #${order.externalOrderId} status changed to ${newStatus}.`,
                data: { orderId, externalOrderId: order.externalOrderId, newStatus },
                read: false,
                createdAt: new Date()
            });
        }

        return true;
    },

    /**
     * Get order details with items (Admin only)
     */
    async 'orders.getDetails'(orderId) {
        check(orderId, String);

        const userId = requireAuth.call(this);

        // Verify admin access
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        const items = await OrderItems.find({ orderId }).fetchAsync();

        return {
            ...order,
            items
        };
    },

    /**
     * Manually assign provider to order (Admin only)
     */
    async 'orders.assignProvider'(orderId, providerId) {
        check(orderId, String);
        check(providerId, String);

        const userId = requireAuth.call(this);

        // Verify admin access
        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        // Get provider and calculate cost
        const { Providers } = await import('/imports/api/collections/Providers');
        const provider = await Providers.findOneAsync(providerId);

        if (!provider) {
            throw new Meteor.Error('not-found', 'Provider not found');
        }

        const providerCost = calculateProviderCost(provider, order);
        const profit = order.total - providerCost - (order.shippingCost || 0);

        await Orders.updateAsync(orderId, {
            $set: {
                assignedProviderId: providerId,
                productionCost: providerCost,
                profit,
                assignmentMethod: 'manual',
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'provider_assigned',
            resourceType: 'order',
            resourceId: orderId,
            metadata: { providerId, providerCost, method: 'manual' },
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Calculate costs for an order with a specific provider
     */
    async 'orders.calculateCosts'(orderId, providerId) {
        check(orderId, String);
        check(providerId, String);

        const order = await Orders.findOneAsync(orderId);
        if (!order) {
            throw new Meteor.Error('not-found', 'Order not found');
        }

        const { Providers } = await import('/imports/api/collections/Providers');
        const provider = await Providers.findOneAsync(providerId);

        if (!provider) {
            throw new Meteor.Error('not-found', 'Provider not found');
        }

        const providerCost = calculateProviderCost(provider, order);
        const profit = order.total - providerCost;
        const profitMargin = order.total > 0 ? (profit / order.total) * 100 : 0;

        return {
            providerCost,
            orderTotal: order.total,
            profit,
            profitMargin: Math.round(profitMargin * 100) / 100
        };
    }
});
