import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Subscriptions } from '../collections/subscriptions';
import { Stores } from '../collections/stores';
import { AuditLogs } from '../collections/audit-logs';
import { StripeService, STRIPE_PRICE_IDS } from '../services/stripe-service';
import { requireAuth, verifyStoreOwnership } from '../users/users';
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
     * Create a checkout session for subscription
     */
    async 'subscriptions.createCheckoutSession'(storeId, planTier, billingCycle = 'monthly') {
        check(storeId, String);
        check(planTier, String);
        check(billingCycle, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        // Validate plan
        if (!SUBSCRIPTION_PLANS[planTier] || planTier === 'free') {
            throw new Meteor.Error('invalid-plan', 'Invalid subscription plan');
        }

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        const user = await Meteor.users.findOneAsync(userId);
        const store = await Stores.findOneAsync(storeId);

        // Create or get Stripe customer
        let stripeCustomerId = subscription.stripeCustomerId;
        
        if (!stripeCustomerId) {
            const customer = await StripeService.createCustomer({
                email: user.emails[0].address,
                name: user.profile?.name || user.emails[0].address,
                metadata: {
                    userId,
                    storeId,
                    storeName: store.name
                }
            });
            
            stripeCustomerId = customer.id;
            
            // Save customer ID
            await Subscriptions.updateAsync(subscription._id, {
                $set: { stripeCustomerId }
            });
        }

        // Get price ID for plan
        const priceId = StripeService.getPriceId(planTier, billingCycle);

        // Create checkout session function
        const baseUrl = Meteor.absoluteUrl();
        const createSession = async (customerId) => {
             return await StripeService.createCheckoutSession({
                customerId: customerId,
                priceId,
                successUrl: `${baseUrl}subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${baseUrl}subscription/cancel`,
                metadata: {
                    userId,
                    storeId,
                    planTier,
                    billingCycle
                }
            });
        };

        try {
             // Create checkout session
            const session = await createSession(stripeCustomerId);
            return {
                sessionId: session.id,
                url: session.url
            };
        } catch (error) {
            // If customer doesn't exist (e.g. switched Stripe keys), create new one and retry
            if (error.reason && error.reason.includes('No such customer')) {
                 console.log('⚠️ Stripe customer not found, creating new one...');
                 
                 const customer = await StripeService.createCustomer({
                    email: user.emails[0].address,
                    name: user.profile?.name || user.emails[0].address,
                    metadata: {
                        userId,
                        storeId,
                        storeName: store.name
                    }
                });
                
                // Update subscription with new customer ID
                await Subscriptions.updateAsync(subscription._id, {
                    $set: { stripeCustomerId: customer.id }
                });
                
                // Retry with new customer ID
                const session = await createSession(customer.id);
                return {
                    sessionId: session.id,
                    url: session.url
                };
            }
            throw error;
        }
    },

    /**
     * Create a customer portal session
     */
    async 'subscriptions.createPortalSession'(storeId) {
        check(storeId, String);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription || !subscription.stripeCustomerId) {
            throw new Meteor.Error('not-found', 'No Stripe customer found');
        }

        const baseUrl = Meteor.absoluteUrl();
        const session = await StripeService.createPortalSession(
            subscription.stripeCustomerId,
            `${baseUrl}subscription`
        );

        return {
            url: session.url
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

        // Update Stripe subscription if it exists
        if (subscription.stripeSubscriptionId && newPlan !== 'free') {
            const newPriceId = StripeService.getPriceId(newPlan, subscription.billingCycle);
            await StripeService.updateSubscription(subscription.stripeSubscriptionId, newPriceId);
            console.log(`💳 Updated Stripe subscription from ${oldPlan} to ${newPlan}`);
        } else {
            console.log(`💳 Plan changed from ${oldPlan} to ${newPlan} (no Stripe subscription)`);
        }

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
    async 'subscriptions.cancel'(storeId, cancelImmediately = false) {
        check(storeId, String);
        check(cancelImmediately, Boolean);

        const userId = requireAuth.call(this);
        await verifyStoreOwnership(userId, storeId);

        const subscription = await Subscriptions.findOneAsync({ storeId });
        if (!subscription) {
            throw new Meteor.Error('not-found', 'Subscription not found');
        }

        // Cancel Stripe subscription if it exists
        if (subscription.stripeSubscriptionId) {
            await StripeService.cancelSubscription(
                subscription.stripeSubscriptionId,
                !cancelImmediately // if cancelImmediately is true, cancelAtPeriodEnd is false
            );
            console.log(`💳 Cancelled Stripe subscription for store ${storeId}`);
        }

        // Update local subscription
        await Subscriptions.updateAsync(subscription._id, {
            $set: {
                status: cancelImmediately ? 'cancelled' : 'active',
                cancelAtPeriodEnd: !cancelImmediately,
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
     * Sync subscription from checkout session
     * (Called by client on success page to ensure immediate update)
     */
    async 'subscriptions.syncFromSession'(sessionId) {
        check(sessionId, String);
        
        const userId = requireAuth.call(this);
        console.log('🔄 Syncing subscription from session:', sessionId);

        // 1. Retrieve the session to get subscription ID and customer
        const session = await StripeService.stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'line_items']
        });

        if (!session) {
            console.error('❌ Session not found:', sessionId);
            throw new Meteor.Error('not-found', 'Session not found');
        }

        console.log('📦 Stripe Session Data:', {
            metadata: session.metadata,
            customer: session.customer,
            subId: session.subscription?.id
        });

        // 2. Get the subscription details
        const subscription = session.subscription;
        if (!subscription) {
            console.error('❌ No subscription in session');
            throw new Meteor.Error('invalid-session', 'No subscription in session');
        }

        // 3. Determine plan tier
        let planTier = session.metadata?.planTier;
        
        // Fallback: Try to identify plan from Price ID if metadata is missing
        if (!planTier && session.line_items?.data[0]) {
            const priceId = session.line_items.data[0].price.id;
            console.log('🔍 Looking up plan for price ID:', priceId);
            
            // Reverse lookup in STRIPE_PRICE_IDS
            for (const [plan, prices] of Object.entries(STRIPE_PRICE_IDS)) {
                if (Object.values(prices).includes(priceId)) {
                    planTier = plan;
                    console.log('✅ Found plan match:', plan);
                    break;
                }
            }
            
            if (!planTier) {
                console.warn('⚠️ Could not identify plan from price ID, defaulting to enterprise');
                planTier = 'enterprise';
            }
        }

        console.log('🎯 Detected Plan Tier:', planTier);

        // 4. Update the local database
        const storeId = session.metadata?.storeId || (await Subscriptions.findOneAsync({ userId }))?.storeId;
        
        if (storeId) {
            const updateResult = await Subscriptions.updateAsync({ storeId }, {
                $set: {
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: subscription.id,
                    planTier: planTier || 'free',
                    limits: SUBSCRIPTION_PLANS[planTier || 'free'].limits,
                    status: subscription.status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    billingCycle: session.metadata?.billingCycle || 'monthly',
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    updatedAt: new Date()
                }
            });
            console.log(`✅ Subscription synced for store ${storeId}. Update result:`, updateResult);
            return true;
        } else {
            console.error('❌ Could not find storeId to update subscription');
        }
        
        return false;
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
