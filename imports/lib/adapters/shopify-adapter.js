import { IntegrationAdapter } from './integration-adapter';
import crypto from 'crypto';

/**
 * Shopify Integration Adapter (Mock Implementation)
 * In production, this would use the actual Shopify API
 */
export class ShopifyAdapter extends IntegrationAdapter {
    constructor(config) {
        super({ ...config, platform: 'shopify' });
        this.apiVersion = '2024-01';
    }

    async initiateOAuth() {
        const { apiKey, redirectUri, scopes } = this.config;
        const state = crypto.randomBytes(16).toString('hex');

        // Mock OAuth URL
        const authUrl = `https://mock-shopify.com/admin/oauth/authorize?` +
            `client_id=${apiKey}&` +
            `scope=${scopes}&` +
            `redirect_uri=${redirectUri}&` +
            `state=${state}`;

        return { authUrl, state };
    }

    async handleOAuthCallback(code) {
        // Mock token exchange
        console.log('🔐 [MOCK] Shopify OAuth callback with code:', code);

        return {
            accessToken: `mock_shopify_token_${crypto.randomBytes(16).toString('hex')}`,
            scope: this.config.scopes,
            expiresAt: null // Shopify tokens don't expire
        };
    }

    async refreshAccessToken(refreshToken) {
        // Shopify tokens don't expire, so no refresh needed
        throw new Error('Shopify tokens do not require refresh');
    }

    async syncProduct(product, variants, design) {
        console.log('📦 [MOCK] Syncing product to Shopify:', product.name);

        // Mock product creation
        const externalProductId = `shopify_${crypto.randomBytes(8).toString('hex')}`;

        // In production, this would make actual API calls to Shopify
        const mockProduct = {
            id: externalProductId,
            title: product.name,
            body_html: product.description,
            vendor: 'Printify Clone',
            product_type: product.type,
            variants: variants.map(v => ({
                id: `variant_${crypto.randomBytes(4).toString('hex')}`,
                title: `${v.size} / ${v.color}`,
                price: ((product.basePrice + v.priceModifier) / 100).toFixed(2),
                sku: v.sku,
                inventory_quantity: v.inStock ? 100 : 0
            })),
            images: design ? [{
                src: design.originalFileUrl,
                alt: design.name
            }] : []
        };

        console.log('✅ [MOCK] Product synced to Shopify:', externalProductId);
        return externalProductId;
    }

    async updateProduct(externalProductId, updates) {
        console.log('🔄 [MOCK] Updating Shopify product:', externalProductId, updates);
        return true;
    }

    async deleteProduct(externalProductId) {
        console.log('🗑️  [MOCK] Deleting Shopify product:', externalProductId);
        return true;
    }

    async fetchOrders(filters = {}) {
        console.log('📥 [MOCK] Fetching Shopify orders with filters:', filters);

        // Mock orders
        return [{
            id: `shopify_order_${Date.now()}`,
            order_number: 1001,
            email: 'customer@example.com',
            created_at: new Date().toISOString(),
            total_price: '49.99',
            financial_status: 'paid',
            fulfillment_status: null,
            line_items: [{
                id: 'line_item_1',
                title: 'Classic T-Shirt',
                variant_title: 'M / Black',
                quantity: 1,
                price: '24.99'
            }],
            shipping_address: {
                first_name: 'John',
                last_name: 'Doe',
                address1: '123 Main St',
                city: 'New York',
                province: 'NY',
                zip: '10001',
                country: 'US',
                phone: '555-1234'
            }
        }];
    }

    async updateOrderStatus(externalOrderId, status) {
        console.log('📦 [MOCK] Updating Shopify order status:', externalOrderId, status);

        // Mock fulfillment creation
        return {
            fulfillment_id: `fulfillment_${crypto.randomBytes(4).toString('hex')}`,
            status: status.status,
            tracking_number: status.trackingNumber,
            tracking_url: status.trackingUrl
        };
    }

    async registerWebhook(topic, callbackUrl) {
        console.log('🔔 [MOCK] Registering Shopify webhook:', topic, callbackUrl);

        return {
            webhook_id: `webhook_${crypto.randomBytes(4).toString('hex')}`,
            topic,
            address: callbackUrl
        };
    }

    verifyWebhookSignature(payload, signature) {
        // Mock signature verification
        // In production: HMAC SHA256 verification
        console.log('🔐 [MOCK] Verifying Shopify webhook signature');
        return true;
    }

    parseWebhook(payload) {
        console.log('📨 [MOCK] Parsing Shopify webhook');

        // Normalize Shopify webhook to our format
        return {
            externalOrderId: payload.id?.toString(),
            orderNumber: payload.order_number,
            customerEmail: payload.email,
            customerName: `${payload.shipping_address?.first_name} ${payload.shipping_address?.last_name}`,
            shippingAddress: {
                firstName: payload.shipping_address?.first_name,
                lastName: payload.shipping_address?.last_name,
                address1: payload.shipping_address?.address1,
                address2: payload.shipping_address?.address2,
                city: payload.shipping_address?.city,
                state: payload.shipping_address?.province,
                zip: payload.shipping_address?.zip,
                country: payload.shipping_address?.country_code,
                phone: payload.shipping_address?.phone
            },
            items: payload.line_items?.map(item => ({
                externalItemId: item.id?.toString(),
                productName: item.title,
                variantName: item.variant_title,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: Math.round(parseFloat(item.price) * 100) // Convert to cents
            })) || []
        };
    }
}
