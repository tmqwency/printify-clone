import { Meteor } from 'meteor/meteor';

/**
 * Shopify API Configuration
 * Using direct HTTP calls instead of SDK to avoid compatibility issues
 */

// Validate configuration on startup
if (Meteor.isServer) {
    const shopifyConfig = Meteor.settings.private?.oauth?.shopify;
    
    if (!shopifyConfig?.apiKey || !shopifyConfig?.apiSecret) {
        console.warn('⚠️  Shopify API credentials not configured. Using mock adapter.');
    } else {
        console.log('✅ Shopify API credentials configured');
    }
}

/**
 * Get Shopify configuration
 */
export function getShopifyConfig() {
    return {
        apiKey: Meteor.settings.private?.oauth?.shopify?.apiKey,
        apiSecret: Meteor.settings.private?.oauth?.shopify?.apiSecret,
        scopes: Meteor.settings.private?.oauth?.shopify?.scopes,
        apiVersion: Meteor.settings.private?.oauth?.shopify?.apiVersion || '2024-01',
    };
}

/**
 * Make authenticated request to Shopify API
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Access token
 * @param {string} endpoint - API endpoint (e.g., '/admin/api/2024-01/products.json')
 * @param {object} options - Fetch options
 */
export async function shopifyRequest(shop, accessToken, endpoint, options = {}) {
    const config = getShopifyConfig();
    const url = `https://${shop}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return await response.json();
}

export default { getShopifyConfig, shopifyRequest };
