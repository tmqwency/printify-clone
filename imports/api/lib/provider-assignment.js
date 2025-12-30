import { Providers } from '../collections/Providers';

/**
 * Find the best provider for an order based on criteria
 * @param {Object} order - Order object with items and shipping info
 * @param {String} criteria - Selection criteria: 'cost', 'speed', 'quality', 'balanced'
 * @returns {Object} Best provider or null
 */
export async function findBestProvider(order, criteria = 'balanced') {
    // Get all active providers
    const providers = await Providers.find({ status: 'active' }).fetchAsync();

    if (providers.length === 0) {
        return null;
    }

    // Filter providers that can handle the product
    const productType = order.items?.[0]?.productType || 'tshirt';
    const capableProviders = providers.filter(provider => {
        return !provider.capabilities?.supportedProducts?.length ||
            provider.capabilities.supportedProducts.includes(productType);
    });

    if (capableProviders.length === 0) {
        return providers[0]; // Fallback to first provider
    }

    // Calculate scores for each provider
    const scoredProviders = capableProviders.map(provider => {
        const cost = calculateProviderCost(provider, order);
        const speed = provider.performance?.avgProductionTime || 5;
        const quality = provider.performance?.qualityRating || 3;
        const onTimeRate = provider.performance?.onTimeRate || 80;

        // Check if domestic or international
        const isDomestic = order.shippingAddress?.country === provider.location?.country;
        const locationBonus = isDomestic ? 10 : 0;

        let score = 0;

        switch (criteria) {
            case 'cost':
                score = (1000 / cost) * 70 + quality * 10 + locationBonus;
                break;
            case 'speed':
                score = (10 / speed) * 60 + quality * 20 + locationBonus;
                break;
            case 'quality':
                score = quality * 60 + (onTimeRate / 10) * 20 + locationBonus;
                break;
            case 'balanced':
            default:
                // Balanced scoring
                score = (1000 / cost) * 40 + // Cost weight 40%
                    (10 / speed) * 30 +   // Speed weight 30%
                    quality * 20 +         // Quality weight 20%
                    locationBonus;         // Location bonus 10%
                break;
        }

        return {
            provider,
            score,
            cost,
            speed,
            quality,
            isDomestic
        };
    });

    // Sort by score (highest first)
    scoredProviders.sort((a, b) => b.score - a.score);

    return scoredProviders[0].provider;
}

/**
 * Calculate the cost for a provider to fulfill an order
 * @param {Object} provider - Provider object
 * @param {Object} order - Order object
 * @returns {Number} Total cost in cents
 */
export function calculateProviderCost(provider, order) {
    const baseCost = provider.pricing?.baseCost || 500; // Default $5.00

    // Determine if domestic or international
    const isDomestic = order.shippingAddress?.country === provider.location?.country;
    const shippingCost = isDomestic
        ? (provider.pricing?.shippingRates?.domestic || 500)
        : (provider.pricing?.shippingRates?.international || 1500);

    // Calculate per item (for now, simple multiplication by quantity)
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;

    return (baseCost * totalItems) + shippingCost;
}

/**
 * Get providers that support a specific product type
 * @param {String} productType - Product type identifier
 * @returns {Array} Array of providers
 */
export async function getProvidersByProduct(productType) {
    const providers = await Providers.find({ status: 'active' }).fetchAsync();

    return providers.filter(provider => {
        return !provider.capabilities?.supportedProducts?.length ||
            provider.capabilities.supportedProducts.includes(productType);
    });
}

/**
 * Calculate profit margin for an order
 * @param {Number} orderTotal - Order total in cents
 * @param {Number} providerCost - Provider cost in cents
 * @returns {Object} Profit details
 */
export function calculateProfit(orderTotal, providerCost) {
    const profit = orderTotal - providerCost;
    const profitMargin = orderTotal > 0 ? (profit / orderTotal) * 100 : 0;

    return {
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        providerCost,
        orderTotal
    };
}
