import { WebApp } from 'meteor/webapp';
import { Subscriptions } from '/imports/api/collections/subscriptions';
import { Stores } from '/imports/api/collections/stores';
import { jsonParser, sendJSON } from './middleware';

const router = WebApp.connectHandlers;

/**
 * Stripe Webhook Handler (Mock Implementation)
 * In production, this would handle real Stripe webhooks
 */

// POST /webhooks/stripe
router.use('/webhooks/stripe', jsonParser, async (req, res) => {
    if (req.method !== 'POST') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        console.log('💳 Stripe webhook received');

        // In production, verify Stripe signature
        const signature = req.headers['stripe-signature'];
        // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

        // Mock event processing
        const event = req.body;

        switch (event.type) {
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
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`⚠️  Unhandled Stripe event: ${event.type}`);
        }

        sendJSON(res, 200, { received: true });
    } catch (error) {
        console.error('❌ Stripe webhook error:', error);
        sendJSON(res, 500, { error: 'Webhook processing failed' });
    }
});

async function handleSubscriptionCreated(subscription) {
    console.log('💳 [MOCK] Subscription created:', subscription.id);

    // Find store by Stripe customer ID
    const store = await Stores.findOneAsync({
        'stripeCustomerId': subscription.customer
    });

    if (store) {
        await Subscriptions.updateAsync(
            { storeId: store._id },
            {
                $set: {
                    stripeSubscriptionId: subscription.id,
                    status: 'active',
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    updatedAt: new Date()
                }
            }
        );
    }
}

async function handleSubscriptionUpdated(subscription) {
    console.log('💳 [MOCK] Subscription updated:', subscription.id);

    const sub = await Subscriptions.findOneAsync({
        stripeSubscriptionId: subscription.id
    });

    if (sub) {
        await Subscriptions.updateAsync(sub._id, {
            $set: {
                status: subscription.status === 'active' ? 'active' : 'cancelled',
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: new Date()
            }
        });
    }
}

async function handleSubscriptionDeleted(subscription) {
    console.log('💳 [MOCK] Subscription deleted:', subscription.id);

    const sub = await Subscriptions.findOneAsync({
        stripeSubscriptionId: subscription.id
    });

    if (sub) {
        await Subscriptions.updateAsync(sub._id, {
            $set: {
                status: 'cancelled',
                canceledAt: new Date(),
                updatedAt: new Date()
            }
        });
    }
}

async function handlePaymentSucceeded(invoice) {
    console.log('💳 [MOCK] Payment succeeded:', invoice.id);

    const sub = await Subscriptions.findOneAsync({
        stripeSubscriptionId: invoice.subscription
    });

    if (sub) {
        await Subscriptions.updateAsync(sub._id, {
            $set: {
                status: 'active',
                updatedAt: new Date()
            }
        });
    }
}

async function handlePaymentFailed(invoice) {
    console.log('💳 [MOCK] Payment failed:', invoice.id);

    const sub = await Subscriptions.findOneAsync({
        stripeSubscriptionId: invoice.subscription
    });

    if (sub) {
        await Subscriptions.updateAsync(sub._id, {
            $set: {
                status: 'past_due',
                updatedAt: new Date()
            }
        });
    }
}

console.log('✅ Stripe webhook handler initialized');
console.log('📡 Stripe webhook URL: /webhooks/stripe');
