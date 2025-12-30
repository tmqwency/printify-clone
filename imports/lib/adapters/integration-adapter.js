/**
 * Base Integration Adapter
 * All platform integrations should extend this class
 */
export class IntegrationAdapter {
    constructor(config) {
        this.config = config;
        this.platform = config.platform;
    }

    /**
     * Initialize OAuth flow
     * @returns {string} OAuth authorization URL
     */
    async initiateOAuth() {
        throw new Error('initiateOAuth must be implemented by subclass');
    }

    /**
     * Handle OAuth callback and exchange code for tokens
     * @param {string} code - Authorization code
     * @returns {object} { accessToken, refreshToken, expiresAt }
     */
    async handleOAuthCallback(code) {
        throw new Error('handleOAuthCallback must be implemented by subclass');
    }

    /**
     * Refresh access token
     * @param {string} refreshToken
     * @returns {object} { accessToken, expiresAt }
     */
    async refreshAccessToken(refreshToken) {
        throw new Error('refreshAccessToken must be implemented by subclass');
    }

    /**
     * Sync product to platform
     * @param {object} product - Product data
     * @param {array} variants - Product variants
     * @param {object} design - Design data
     * @returns {string} External product ID
     */
    async syncProduct(product, variants, design) {
        throw new Error('syncProduct must be implemented by subclass');
    }

    /**
     * Update product on platform
     * @param {string} externalProductId
     * @param {object} updates
     */
    async updateProduct(externalProductId, updates) {
        throw new Error('updateProduct must be implemented by subclass');
    }

    /**
     * Delete product from platform
     * @param {string} externalProductId
     */
    async deleteProduct(externalProductId) {
        throw new Error('deleteProduct must be implemented by subclass');
    }

    /**
     * Fetch orders from platform
     * @param {object} filters - Date range, status, etc.
     * @returns {array} Orders
     */
    async fetchOrders(filters = {}) {
        throw new Error('fetchOrders must be implemented by subclass');
    }

    /**
     * Update order status on platform
     * @param {string} externalOrderId
     * @param {object} status - { status, trackingNumber, trackingUrl }
     */
    async updateOrderStatus(externalOrderId, status) {
        throw new Error('updateOrderStatus must be implemented by subclass');
    }

    /**
     * Register webhook on platform
     * @param {string} topic - Webhook topic (e.g., 'orders/create')
     * @param {string} callbackUrl - Our webhook endpoint
     */
    async registerWebhook(topic, callbackUrl) {
        throw new Error('registerWebhook must be implemented by subclass');
    }

    /**
     * Verify webhook signature
     * @param {object} payload - Webhook payload
     * @param {string} signature - Webhook signature
     * @returns {boolean}
     */
    verifyWebhookSignature(payload, signature) {
        throw new Error('verifyWebhookSignature must be implemented by subclass');
    }

    /**
     * Parse incoming webhook
     * @param {object} payload - Raw webhook payload
     * @returns {object} Normalized order data
     */
    parseWebhook(payload) {
        throw new Error('parseWebhook must be implemented by subclass');
    }
}
