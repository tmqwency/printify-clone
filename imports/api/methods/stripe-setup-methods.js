import { Meteor } from 'meteor/meteor';
import StripeService from '../services/stripe-service';

/**
 * Admin method to create Stripe products and prices
 * This should only be run once to set up the products
 */
Meteor.methods({
    async 'admin.createStripeProducts'() {
        // Only allow in development
        if (Meteor.settings.public?.environment !== 'development') {
            throw new Meteor.Error('not-allowed', 'This method can only be run in development');
        }

        const stripe = StripeService.getStripe();
        const results = {};

        try {
            // Create Starter Plan
            console.log('Creating Starter plan...');
            const starterProduct = await stripe.products.create({
                name: 'Starter Plan',
                description: '100 orders/month, 50 products, 10K API calls'
            });

            const starterMonthly = await stripe.prices.create({
                product: starterProduct.id,
                unit_amount: 2900, // $29.00
                currency: 'usd',
                recurring: { interval: 'month' }
            });

            const starterYearly = await stripe.prices.create({
                product: starterProduct.id,
                unit_amount: 23200, // $232.00 (20% discount)
                currency: 'usd',
                recurring: { interval: 'year' }
            });

            results.starter = {
                monthly: starterMonthly.id,
                yearly: starterYearly.id
            };

            // Create Pro Plan
            console.log('Creating Pro plan...');
            const proProduct = await stripe.products.create({
                name: 'Pro Plan',
                description: '1K orders/month, 500 products, 100K API calls'
            });

            const proMonthly = await stripe.prices.create({
                product: proProduct.id,
                unit_amount: 9900, // $99.00
                currency: 'usd',
                recurring: { interval: 'month' }
            });

            const proYearly = await stripe.prices.create({
                product: proProduct.id,
                unit_amount: 79200, // $792.00 (20% discount)
                currency: 'usd',
                recurring: { interval: 'year' }
            });

            results.pro = {
                monthly: proMonthly.id,
                yearly: proYearly.id
            };

            // Create Enterprise Plan
            console.log('Creating Enterprise plan...');
            const enterpriseProduct = await stripe.products.create({
                name: 'Enterprise Plan',
                description: 'Unlimited everything'
            });

            const enterpriseMonthly = await stripe.prices.create({
                product: enterpriseProduct.id,
                unit_amount: 29900, // $299.00
                currency: 'usd',
                recurring: { interval: 'month' }
            });

            const enterpriseYearly = await stripe.prices.create({
                product: enterpriseProduct.id,
                unit_amount: 239200, // $2,392.00 (20% discount)
                currency: 'usd',
                recurring: { interval: 'year' }
            });

            results.enterprise = {
                monthly: enterpriseMonthly.id,
                yearly: enterpriseYearly.id
            };

            console.log('✅ All Stripe products created successfully!');
            console.log('Price IDs:', JSON.stringify(results, null, 2));

            return {
                success: true,
                priceIds: results,
                message: 'Update STRIPE_PRICE_IDS in stripe-service.js with these values'
            };

        } catch (error) {
            console.error('❌ Error creating Stripe products:', error);
            throw new Meteor.Error('stripe-error', error.message);
        }
    }
});
