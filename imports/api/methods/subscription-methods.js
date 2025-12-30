import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { requireAuth, verifyStoreOwnership } from '/imports/api/users/users';
import { Subscriptions } from '/imports/api/collections/subscriptions';
import { Stores } from '/imports/api/collections/stores';
import { AuditLogs } from '/imports/api/collections/audit-logs';

// Plan definitions
export const SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free',
        price: 0,
        limits: {
            maxOrders: 10,
            maxProducts: 5,
            maxApiCalls: 1000,
            maxStorageMB: 100
        }
    },
    starter: {
        name: 'Starter',
        price: 2900, // $29/month
        limits: {
            maxOrders: 100,
            maxProducts: 50,
            maxApiCalls: 10000,
            maxStorageMB: 1000
        }
    },
    pro: {
        name: 'Pro',
        price: 9900, // $99/month
        limits: {
            maxOrders: 1000,
            maxProducts: 500,
            maxApiCalls: 100000,
            maxStorageMB: 10000
        }
    },
    enterprise: {
        name: 'Enterprise',
        price: 29900, // $299/month
        limits: {
            maxOrders: -1, // Unlimited
            maxProducts: -1,
            maxApiCalls: -1,
            maxStorageMB: -1
        }
    }
};

Meteor.methods({
    /**
     * Get subscription details
     */
    async 'subscriptions.get'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        return {
            ...subscription,
            planDetails: SUBSCRIPTION_PLANS[subscription.planTier]
        };
    },

    /**
     * Upgrade/downgrade subscription plan
     */
    async 'subscriptions.changePlan'(storeId, newPlan) {
        check(storeId, String);
        check(newPlan, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        // Validate plan
        if (!SUBSCRIPTION_PLANS[newPlan]) {
            throw new Meteor.Error('invalid-plan', 'Invalid subscription plan');
        }

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        const oldPlan = subscription.planTier;

        // Mock Stripe subscription update
        // In production, this would call Stripe API
        console.log(`💳 [MOCK] Changing plan from ${oldPlan} to ${newPlan}`);

        // Update subscription
        await Subscriptions.updateAsync(subscription._id, {
            $set: {
                planTier: newPlan,
                limits: SUBSCRIPTION_PLANS[newPlan].limits,
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'subscription_plan_changed',
            resourceType: 'subscription',
            resourceId: subscription._id,
            storeId,
            changes: { from: oldPlan, to: newPlan },
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Track usage (called internally by other methods)
     */
    async 'subscriptions.trackUsage'(storeId, usageType, amount = 1) {
        check(storeId, String);
        check(usageType, String);
        check(amount, Number);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        // Update usage
        const updateField = `usage.${usageType}`;
        await Subscriptions.updateAsync(subscription._id, {
            $inc: { [updateField]: amount },
            $set: { updatedAt: new Date() }
        });

        // Check if limit exceeded
        const updatedSub = await Subscriptions.findOneAsync(subscription._id);
        const limit = subscription.limits[usageType.replace('ThisMonth', '').replace('Created', '')];
        const currentUsage = updatedSub.usage[usageType];

        if (limit !== -1 && currentUsage >= limit) {
            console.warn(`⚠️  Usage limit reached for ${storeId}: ${usageType} = ${currentUsage}/${limit}`);

            // Could send notification email here
            return { limitReached: true, current: currentUsage, limit };
        }

        return { limitReached: false, current: currentUsage, limit };
    },

    /**
     * Check if action is allowed based on limits
     */
    async 'subscriptions.checkLimit'(storeId, limitType) {
        check(storeId, String);
        check(limitType, String);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        const usageKey = `${limitType}ThisMonth`;
        const limitKey = `max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`;

        const currentUsage = subscription.usage[usageKey] || 0;
        const limit = subscription.limits[limitKey];

        // -1 means unlimited
        if (limit === -1) {
            return { allowed: true, current: currentUsage, limit: 'unlimited' };
        }

        const allowed = currentUsage < limit;
        return { allowed, current: currentUsage, limit };
    },

    /**
     * Reset monthly usage (called by cron job)
     */
    async 'subscriptions.resetMonthlyUsage'() {
        // This would be called by a cron job at the start of each month
        const result = await Subscriptions.updateAsync(
            {},
            {
                $set: {
                    'usage.ordersThisMonth': 0,
                    'usage.apiCallsThisMonth': 0,
                    updatedAt: new Date()
                }
            },
            { multi: true }
        );

        console.log(`🔄 Reset monthly usage for ${result} subscriptions`);
        return result;
    },

    /**
     * Cancel subscription
     */
    async 'subscriptions.cancel'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        // Mock Stripe cancellation
        console.log(`💳 [MOCK] Canceling subscription for store ${storeId}`);

        // Update subscription
        await Subscriptions.updateAsync(subscription._id, {
            $set: {
                status: 'cancelled',
                cancelAtPeriodEnd: true,
                canceledAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId,
            action: 'subscription_cancelled',
            resourceType: 'subscription',
            resourceId: subscription._id,
            storeId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Get usage statistics
     */
    async 'subscriptions.getUsageStats'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        const planDetails = SUBSCRIPTION_PLANS[subscription.planTier];

        return {
            plan: subscription.planTier,
            usage: subscription.usage,
            limits: subscription.limits,
            percentages: {
                orders: subscription.limits.maxOrders === -1 ? 0 :
                    (subscription.usage.ordersThisMonth / subscription.limits.maxOrders) * 100,
                products: subscription.limits.maxProducts === -1 ? 0 :
                    (subscription.usage.productsCreated / subscription.limits.maxProducts) * 100,
                apiCalls: subscription.limits.maxApiCalls === -1 ? 0 :
                    (subscription.usage.apiCallsThisMonth / subscription.limits.maxApiCalls) * 100,
                storage: subscription.limits.maxStorageMB === -1 ? 0 :
                    (subscription.usage.storageUsedMB / subscription.limits.maxStorageMB) * 100
            }
        };
    }
});
