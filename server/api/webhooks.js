import { WebApp } from 'meteor/webapp';
import { Orders } from '/imports/api/collections/orders';
import { OrderItems } from '/imports/api/collections/order-items';
import { Stores } from '/imports/api/collections/stores';
import { IntegrationFactory } from '/imports/lib/adapters/integration-factory';
import { jsonParser, sendJSON } from './middleware';
import crypto from 'crypto';

const router = WebApp.connectHandlers;

/**
 * Webhook receiver for platform integrations
 * Receives order notifications from Shopify, WooCommerce, etc.
 */

// POST /webhooks/:platform/:storeId
router.use('/webhooks/:platform/:storeId', jsonParser, async (req, res) => {
    if (req.method !== 'POST') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        // Extract platform and storeId from URL
        const urlParts = req.url.split('/');
        const platform = urlParts[2];
        const storeId = urlParts[3];

        console.log(`📨 Webhook received from ${platform} for store ${storeId}`);

        // Get store
        const store = await Stores.findOneAsync({ _id: storeId, platform });
        if (!store) {
            sendJSON(res, 404, { error: 'Store not found' });
            return;
        }

        // Get integration adapter
        const adapter = IntegrationFactory.create(platform, {
            apiKey: store.apiKey,
            apiSecret: store.apiSecret,
            accessToken: store.accessToken
        });

        if (!adapter) {
            sendJSON(res, 400, { error: 'Unsupported platform' });
            return;
        }

        // Verify webhook signature
        const signature = req.headers['x-webhook-signature'] ||
            req.headers['x-shopify-hmac-sha256'] ||
            req.headers['x-wc-webhook-signature'];

        if (signature && !adapter.verifyWebhookSignature(req.body, signature)) {
            console.error('❌ Invalid webhook signature');
            sendJSON(res, 401, { error: 'Invalid signature' });
            return;
        }

        // Parse webhook payload
        const orderData = adapter.parseWebhook(req.body);

        // Check if order already exists
        const existingOrder = await Orders.findOneAsync({
            storeId,
            externalOrderId: orderData.externalOrderId
        });

        if (existingOrder) {
            console.log(`⚠️  Order ${orderData.externalOrderId} already exists, skipping`);
            sendJSON(res, 200, { message: 'Order already processed' });
            return;
        }

        // Create order
        const orderId = await Orders.insertAsync({
            storeId,
            externalOrderId: orderData.externalOrderId,
            platform,
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

        // Create order items
        let subtotal = 0;
        for (const item of orderData.items) {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;

            await OrderItems.insertAsync({
                orderId,
                externalItemId: item.externalItemId,
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
        }

        // Update order totals
        await Orders.updateAsync(orderId, {
            $set: {
                subtotal,
                total: subtotal,
                updatedAt: new Date()
            }
        });

        console.log(`✅ Order ${orderData.externalOrderId} created successfully`);

        sendJSON(res, 200, {
            message: 'Webhook processed successfully',
            orderId
        });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        sendJSON(res, 500, {
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

console.log('✅ Webhook routes initialized');
console.log('📡 Webhook URL: /webhooks/:platform/:storeId');
