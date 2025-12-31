import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import StripeService from '../services/stripe-service';
import { Subscriptions } from '../collections/subscriptions';
import { SUBSCRIPTION_PLANS } from '../methods/subscription-methods';

/**
 * Stripe Webhook Handler
 * Handles events from Stripe for subscription lifecycle management
 */

// Helper to get raw body for webhook signature verification
const getRawBody = (req) => {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
        req.on('error', reject);
    });
};

// Map Stripe plan/price to our plan tiers
const getPlanTierFromPrice = (priceId) => {
    // This is a simple mapping - in production you'd want a more robust solution
    if (priceId.includes('starter')) return 'starter';
    if (priceId.includes('pro')) return 'pro';
    if (priceId.includes('enterprise')) return 'enterprise';
    return 'free';
};

// Webhook endpoint
WebApp.connectHandlers.use('/api/stripe/webhook', async (req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
    }

    try {
        // Get raw body for signature verification
        const rawBody = await getRawBody(req);
        const signature = req.headers['stripe-signature'];
        const webhookSecret = Meteor.settings.private?.stripe?.webhookSecret;

        if (!webhookSecret) {
            console.error('❌ Webhook secret not configured');
            res.statusCode = 500;
            res.end('Webhook secret not configured');
            return;
        }

        // Verify webhook signature
        let event;
        try {
            event = StripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
        } catch (err) {
            console.error('❌ Webhook signature verification failed:', err.message);
            res.statusCode = 400;
            res.end(`Webhook Error: ${err.message}`);
            return;
        }

        console.log(`📥 Received Stripe webhook: ${event.type}`);

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                console.log(`ℹ️  Unhandled event type: ${event.type}`);
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ received: true }));

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
});

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session) {
    console.log('✅ Checkout session completed:', session.id);

    const { storeId, userId, planTier, billingCycle } = session.metadata;

    if (!storeId || !userId) {
        console.error('❌ Missing metadata in checkout session');
        return;
    }

    // The subscription will be created in the subscription.created event
    // Here we just log the successful checkout
    console.log(`💳 Checkout completed for store ${storeId}, plan: ${planTier}`);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
    console.log('✅ Subscription created:', subscription.id);

    const { storeId, userId, planTier, billingCycle } = subscription.metadata;

    if (!storeId) {
        console.error('❌ Missing storeId in subscription metadata');
        return;
    }

    // Get plan tier from price if not in metadata
    let tier = planTier;
    if (!tier && subscription.items.data[0]) {
        const priceId = subscription.items.data[0].price.id;
        tier = getPlanTierFromPrice(priceId);
    }

    // Update subscription record
    const existingSub = await Subscriptions.findOneAsync({ storeId });
    if (existingSub) {
        await Subscriptions.updateAsync(existingSub._id, {
            $set: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer,
                planTier: tier || existingSub.planTier,
                limits: SUBSCRIPTION_PLANS[tier || existingSub.planTier].limits,
                status: subscription.status === 'active' ? 'active' : 'trialing',
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                billingCycle: billingCycle || existingSub.billingCycle,
                cancelAtPeriodEnd: false,
                updatedAt: new Date()
            }
        });

        console.log(`✅ Updated subscription for store ${storeId}`);
    }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
    console.log('✅ Subscription updated:', subscription.id);

    const existingSub = await Subscriptions.findOneAsync({
        stripeSubscriptionId: subscription.id
    });

    if (!existingSub) {
        console.error('❌ Subscription not found:', subscription.id);
        return;
    }

    // Determine plan tier from price
    let planTier = existingSub.planTier;
    if (subscription.items.data[0]) {
        const priceId = subscription.items.data[0].price.id;
        planTier = getPlanTierFromPrice(priceId);
    }

    // Update subscription
    await Subscriptions.updateAsync(existingSub._id, {
        $set: {
            planTier,
            limits: SUBSCRIPTION_PLANS[planTier].limits,
            status: subscription.status === 'active' ? 'active' : subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date()
        }
    });

    console.log(`✅ Updated subscription for store ${existingSub.storeId}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
    console.log('✅ Subscription deleted:', subscription.id);

    const existingSub = await Subscriptions.findOneAsync({
        stripeSubscriptionId: subscription.id
    });

    if (!existingSub) {
        console.error('❌ Subscription not found:', subscription.id);
        return;
    }

    // Downgrade to free plan
    await Subscriptions.updateAsync(existingSub._id, {
        $set: {
            planTier: 'free',
            limits: SUBSCRIPTION_PLANS.free.limits,
            status: 'cancelled',
            canceledAt: new Date(),
            updatedAt: new Date()
        }
    });

    console.log(`✅ Subscription cancelled for store ${existingSub.storeId}`);
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice) {
    console.log('✅ Invoice payment succeeded:', invoice.id);

    if (invoice.subscription) {
        const existingSub = await Subscriptions.findOneAsync({
            stripeSubscriptionId: invoice.subscription
        });

        if (existingSub) {
            await Subscriptions.updateAsync(existingSub._id, {
                $set: {
                    status: 'active',
                    updatedAt: new Date()
                }
            });

            console.log(`✅ Payment successful for store ${existingSub.storeId}`);
        }
    }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice) {
    console.log('❌ Invoice payment failed:', invoice.id);

    if (invoice.subscription) {
        const existingSub = await Subscriptions.findOneAsync({
            stripeSubscriptionId: invoice.subscription
        });

        if (existingSub) {
            await Subscriptions.updateAsync(existingSub._id, {
                $set: {
                    status: 'past_due',
                    updatedAt: new Date()
                }
            });

            console.log(`⚠️  Payment failed for store ${existingSub.storeId}`);
            // TODO: Send email notification to user
        }
    }
}

console.log('✅ Stripe webhook handler registered at /api/stripe/webhook');
