import { ShopifyAdapter } from './shopify-adapter';
import { WooCommerceAdapter } from './woocommerce-adapter';

/**
 * Integration Factory
 * Creates the appropriate adapter based on platform
 */
export class IntegrationFactory {
    static create(platform, config) {
        switch (platform.toLowerCase()) {
            case 'shopify':
                return new ShopifyAdapter(config);

            case 'woocommerce':
                return new WooCommerceAdapter(config);

            case 'etsy':
                // TODO: Implement Etsy adapter
                throw new Error('Etsy integration not yet implemented');

            case 'bigcommerce':
                // TODO: Implement BigCommerce adapter
                throw new Error('BigCommerce integration not yet implemented');

            case 'api':
                // Generic API integration (uses our REST API)
                return null;

            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    static getSupportedPlatforms() {
        return [
            { id: 'shopify', name: 'Shopify', requiresOAuth: true },
            { id: 'woocommerce', name: 'WooCommerce', requiresOAuth: false },
            { id: 'etsy', name: 'Etsy', requiresOAuth: true, status: 'coming_soon' },
            { id: 'bigcommerce', name: 'BigCommerce', requiresOAuth: true, status: 'coming_soon' },
            { id: 'api', name: 'API Integration', requiresOAuth: false }
        ];
    }
}
