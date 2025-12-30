import { IntegrationAdapter } from './integration-adapter';
import crypto from 'crypto';

/**
 * WooCommerce Integration Adapter (Mock Implementation)
 */
export class WooCommerceAdapter extends IntegrationAdapter {
    constructor(config) {
        super({ ...config, platform: 'woocommerce' });
    }

    async initiateOAuth() {
        // WooCommerce uses consumer key/secret, not OAuth
        throw new Error('WooCommerce uses API keys, not OAuth');
    }

    async handleOAuthCallback(code) {
        throw new Error('WooCommerce uses API keys, not OAuth');
    }

    async syncProduct(product, variants, design) {
        console.log('📦 [MOCK] Syncing product to WooCommerce:', product.name);

        const externalProductId = `woo_${crypto.randomBytes(8).toString('hex')}`;

        console.log('✅ [MOCK] Product synced to WooCommerce:', externalProductId);
        return externalProductId;
    }

    async updateProduct(externalProductId, updates) {
        console.log('🔄 [MOCK] Updating WooCommerce product:', externalProductId);
        return true;
    }

    async deleteProduct(externalProductId) {
        console.log('🗑️  [MOCK] Deleting WooCommerce product:', externalProductId);
        return true;
    }

    async fetchOrders(filters = {}) {
        console.log('📥 [MOCK] Fetching WooCommerce orders');
        return [];
    }

    async updateOrderStatus(externalOrderId, status) {
        console.log('📦 [MOCK] Updating WooCommerce order:', externalOrderId);
        return true;
    }

    async registerWebhook(topic, callbackUrl) {
        console.log('🔔 [MOCK] Registering WooCommerce webhook:', topic);
        return { id: `webhook_${crypto.randomBytes(4).toString('hex')}` };
    }

    verifyWebhookSignature(payload, signature) {
        console.log('🔐 [MOCK] Verifying WooCommerce webhook');
        return true;
    }

    parseWebhook(payload) {
        console.log('📨 [MOCK] Parsing WooCommerce webhook');
        return {
            externalOrderId: payload.id?.toString(),
            customerEmail: payload.billing?.email,
            customerName: `${payload.billing?.first_name} ${payload.billing?.last_name}`,
            shippingAddress: {
                firstName: payload.shipping?.first_name,
                lastName: payload.shipping?.last_name,
                address1: payload.shipping?.address_1,
                address2: payload.shipping?.address_2,
                city: payload.shipping?.city,
                state: payload.shipping?.state,
                zip: payload.shipping?.postcode,
                country: payload.shipping?.country,
                phone: payload.billing?.phone
            },
            items: payload.line_items?.map(item => ({
                externalItemId: item.id?.toString(),
                productName: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: Math.round(parseFloat(item.price) * 100)
            })) || []
        };
    }
}
