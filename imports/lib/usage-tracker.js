import { Meteor } from 'meteor/meteor';
import { Subscriptions } from '/imports/api/collections/subscriptions';

/**
 * Usage Tracker
 * Automatically tracks usage and enforces limits
 */
export class UsageTracker {
    /**
     * Track order creation
     */
    static async trackOrder(storeId) {
        const result = await Meteor.callAsync('subscriptions.trackUsage', storeId, 'ordersThisMonth', 1);

        if (result.limitReached) {
            throw new Meteor.Error(
                'limit-exceeded',
                `Order limit reached (${result.current}/${result.limit}). Please upgrade your plan.`
            );
        }
    }

    /**
     * Track product creation
     */
    static async trackProduct(storeId) {
        const result = await Meteor.callAsync('subscriptions.trackUsage', storeId, 'productsCreated', 1);

        if (result.limitReached) {
            throw new Meteor.Error(
                'limit-exceeded',
                `Product limit reached (${result.current}/${result.limit}). Please upgrade your plan.`
            );
        }
    }

    /**
     * Track API call
     */
    static async trackApiCall(storeId) {
        const result = await Meteor.callAsync('subscriptions.trackUsage', storeId, 'apiCallsThisMonth', 1);

        if (result.limitReached) {
            throw new Meteor.Error(
                'limit-exceeded',
                `API call limit reached (${result.current}/${result.limit}). Please upgrade your plan.`
            );
        }
    }

    /**
     * Track storage usage
     */
    static async trackStorage(storeId, sizeMB) {
        const result = await Meteor.callAsync('subscriptions.trackUsage', storeId, 'storageUsedMB', sizeMB);

        if (result.limitReached) {
            throw new Meteor.Error(
                'limit-exceeded',
                `Storage limit reached (${result.current}MB/${result.limit}MB). Please upgrade your plan.`
            );
        }
    }

    /**
     * Check if action is allowed
     */
    static async checkLimit(storeId, limitType) {
        const result = await Meteor.callAsync('subscriptions.checkLimit', storeId, limitType);

        if (!result.allowed) {
            throw new Meteor.Error(
                'limit-exceeded',
                `${limitType} limit reached (${result.current}/${result.limit}). Please upgrade your plan.`
            );
        }

        return result;
    }
}

/**
 * Monthly usage reset job
 * Runs on the 1st of each month
 */
if (Meteor.isServer) {
    Meteor.startup(() => {
        // Schedule monthly reset
        const scheduleMonthlyReset = () => {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
            const msUntilReset = nextMonth.getTime() - now.getTime();

            console.log(`📅 Next usage reset scheduled for: ${nextMonth.toISOString()}`);

            Meteor.setTimeout(async () => {
                console.log('🔄 Running monthly usage reset...');
                await Meteor.callAsync('subscriptions.resetMonthlyUsage');
                console.log('✅ Monthly usage reset complete');

                // Schedule next reset
                scheduleMonthlyReset();
            }, msUntilReset);
        };

        // Start scheduling
        scheduleMonthlyReset();
    });
}
