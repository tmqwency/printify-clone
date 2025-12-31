import { Meteor } from 'meteor/meteor';

// Initialize Stripe with secret key from settings
let stripe = null;

if (Meteor.isServer) {
    const stripeSecretKey = Meteor.settings.private?.stripe?.secretKey;
    
    if (!stripeSecretKey) {
        console.warn('⚠️  Stripe secret key not found in settings');
    } else {
        // Use require() for better Meteor compatibility
        const Stripe = require('stripe');
        stripe = Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16'
        });
        console.log('✅ Stripe initialized successfully');
    }
}

// Stripe Price IDs for each plan
// These are created in Stripe Dashboard and mapped here
export const STRIPE_PRICE_IDS = {
    starter: {
        monthly: 'price_1SkT3vPpNQufD1wY0mzw4zDH',
        yearly: 'price_1SkT3wPpNQufD1wYsUd2f2ct'
    },
    pro: {
        monthly: 'price_1SkT3wPpNQufD1wYO7LsMxtb',
        yearly: 'price_1SkT3xPpNQufD1wYT0hguZo2'
    },
    enterprise: {
        monthly: 'price_1SkT3yPpNQufD1wY246qMSE5',
        yearly: 'price_1SkT3yPpNQufD1wYvMhjJiFH'
    }
};

/**
 * Stripe Service - Wrapper for Stripe API calls
 */
export const StripeService = {
    /**
     * Get Stripe instance
     */
    getStripe() {
        if (!stripe) {
            throw new Meteor.Error('stripe-not-configured', 'Stripe is not configured');
        }
        return stripe;
    },

    /**
     * Create a Stripe customer
     */
    async createCustomer({ email, name, metadata = {} }) {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
                metadata
            });
            
            console.log(`✅ Created Stripe customer: ${customer.id}`);
            return customer;
        } catch (error) {
            console.error('❌ Error creating Stripe customer:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Get a Stripe customer
     */
    async getCustomer(customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            return customer;
        } catch (error) {
            console.error('❌ Error retrieving Stripe customer:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Create a checkout session for subscription
     */
    async createCheckoutSession({ 
        customerId, 
        priceId, 
        successUrl, 
        cancelUrl,
        metadata = {},
        trialPeriodDays = null
    }) {
        try {
            const sessionParams = {
                customer: customerId,
                mode: 'subscription',
                line_items: [{
                    price: priceId,
                    quantity: 1
                }],
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata,
                subscription_data: {
                    metadata
                }
            };

            if (trialPeriodDays) {
                sessionParams.subscription_data.trial_period_days = trialPeriodDays;
            }

            const session = await stripe.checkout.sessions.create(sessionParams);
            
            console.log(`✅ Created checkout session: ${session.id}`);
            return session;
        } catch (error) {
            console.error('❌ Error creating checkout session:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Create a subscription directly (without checkout)
     */
    async createSubscription({ customerId, priceId, metadata = {}, trialPeriodDays = null }) {
        try {
            const subscriptionParams = {
                customer: customerId,
                items: [{ price: priceId }],
                metadata
            };

            if (trialPeriodDays) {
                subscriptionParams.trial_period_days = trialPeriodDays;
            }

            const subscription = await stripe.subscriptions.create(subscriptionParams);
            
            console.log(`✅ Created subscription: ${subscription.id}`);
            return subscription;
        } catch (error) {
            console.error('❌ Error creating subscription:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Update a subscription (change plan)
     */
    async updateSubscription(subscriptionId, newPriceId) {
        try {
            // Get the subscription
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Update the subscription with new price
            const updated = await stripe.subscriptions.update(subscriptionId, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }],
                proration_behavior: 'always_invoice'
            });
            
            console.log(`✅ Updated subscription: ${subscriptionId}`);
            return updated;
        } catch (error) {
            console.error('❌ Error updating subscription:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
        try {
            let subscription;
            
            if (cancelAtPeriodEnd) {
                // Cancel at end of billing period
                subscription = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true
                });
            } else {
                // Cancel immediately
                subscription = await stripe.subscriptions.cancel(subscriptionId);
            }
            
            console.log(`✅ Cancelled subscription: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            console.error('❌ Error cancelling subscription:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            return subscription;
        } catch (error) {
            console.error('❌ Error retrieving subscription:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Create a customer portal session
     */
    async createPortalSession(customerId, returnUrl) {
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl
            });
            
            console.log(`✅ Created portal session for customer: ${customerId}`);
            return session;
        } catch (error) {
            console.error('❌ Error creating portal session:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    },

    /**
     * Construct webhook event from request
     */
    constructWebhookEvent(payload, signature, webhookSecret) {
        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );
            return event;
        } catch (error) {
            console.error('❌ Webhook signature verification failed:', error);
            throw new Meteor.Error('webhook-error', error.message);
        }
    },

    /**
     * Get price ID for plan and billing cycle
     */
    getPriceId(planTier, billingCycle = 'monthly') {
        if (planTier === 'free') {
            return null; // Free plan doesn't need a price ID
        }

        const priceId = STRIPE_PRICE_IDS[planTier]?.[billingCycle];
        if (!priceId) {
            throw new Meteor.Error('invalid-plan', `No price ID found for ${planTier} ${billingCycle}`);
        }

        return priceId;
    }
};

export default StripeService;
