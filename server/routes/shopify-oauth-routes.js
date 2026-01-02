import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Stores } from '../../imports/api/collections/stores';
import crypto from 'crypto';

/**
 * Shopify OAuth Routes
 * Handles the OAuth flow for connecting Shopify stores
 */

// Store OAuth states temporarily (in production, use Redis or database)
const oauthStates = new Map();

/**
 * Route: /api/oauth/shopify/install
 * Initiates OAuth flow by redirecting to Shopify
 */
WebApp.connectHandlers.use('/api/oauth/shopify/install', async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const shop = url.searchParams.get('shop');
        const userId = url.searchParams.get('userId');

        if (!shop) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing shop parameter' }));
            return;
        }

        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing userId parameter' }));
            return;
        }

        // Normalize shop domain
        const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

        // Generate OAuth state for CSRF protection
        const state = crypto.randomBytes(16).toString('hex');
        
        // Store state with userId for callback validation
        oauthStates.set(state, { userId, shop: shopDomain, timestamp: Date.now() });

        // Clean up old states (older than 10 minutes)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [key, value] of oauthStates.entries()) {
            if (value.timestamp < tenMinutesAgo) {
                oauthStates.delete(key);
            }
        }

        // Build OAuth authorization URL
        const redirectUri = `http://${req.headers.host}/api/oauth/shopify/callback`;
        
        const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
            `client_id=${Meteor.settings.private.oauth.shopify.apiKey}&` +
            `scope=${Meteor.settings.private.oauth.shopify.scopes}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `state=${state}`;

        console.log('🔐 Initiating Shopify OAuth for shop:', shopDomain);

        // Redirect to Shopify authorization page
        res.writeHead(302, { 'Location': authUrl });
        res.end();

    } catch (error) {
        console.error('❌ Error initiating Shopify OAuth:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to initiate OAuth' }));
    }
});

/**
 * Route: /api/oauth/shopify/callback
 * Handles OAuth callback from Shopify
 */
WebApp.connectHandlers.use('/api/oauth/shopify/callback', async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const shop = url.searchParams.get('shop');
        const hmac = url.searchParams.get('hmac');

        // Validate parameters
        if (!code || !state || !shop) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>OAuth Error</h1><p>Missing required parameters</p>');
            return;
        }


        // Verify state to prevent CSRF
        const stateData = oauthStates.get(state);
        
        // Extract userId from state (format: userId_timestamp)
        let userId = stateData?.userId;
        
        if (!stateData) {
            console.warn('⚠️  State not found in memory, attempting to extract userId from state parameter');
            // State format from client: userId_timestamp
            const stateParts = state.split('_');
            if (stateParts.length >= 2) {
                userId = stateParts[0];
                console.log('✅ Extracted userId from state:', userId);
            } else {
                console.warn('⚠️  Could not extract userId from state, store will be created without userId');
            }
        }

        // Clean up used state if it exists
        if (stateData) {
            oauthStates.delete(state);
        }

        // Verify HMAC signature
        const isValid = verifyShopifyHmac(req.url, hmac);
        if (!isValid) {
            console.error('❌ Invalid HMAC signature');
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>OAuth Error</h1><p>Invalid signature</p>');
            return;
        }

        console.log('✅ HMAC verified for shop:', shop);

        // Exchange authorization code for access token
        const tokenResponse = await exchangeCodeForToken(shop, code);

        if (!tokenResponse.access_token) {
            throw new Error('Failed to obtain access token');
        }

        console.log('✅ Access token obtained for shop:', shop);

        // Create or update store record
        // Note: userId will be null if state was missing (dev mode)
        // User will need to manually associate store with their account
        const storeId = await Stores.insertAsync({
            name: shop.replace('.myshopify.com', ''),
            platform: 'shopify',
            platformStoreId: shop,
            platformStoreName: shop,
            userId: userId || null, // Will be null in dev mode without proper state
            accessToken: tokenResponse.access_token,
            tokenExpiresAt: null, // Shopify tokens don't expire
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('✅ Store created:', storeId);

        // Redirect to success page
        res.writeHead(302, { 
            'Location': `http://${req.headers.host}/dashboard/stores?success=true&store=${storeId}` 
        });
        res.end();

    } catch (error) {
        console.error('❌ Error in OAuth callback:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>OAuth Error</h1><p>${error.message}</p>`);
    }
});

/**
 * Verify Shopify HMAC signature
 * @param {string} url - Full callback URL
 * @param {string} hmac - HMAC signature from Shopify
 * @returns {boolean}
 */
function verifyShopifyHmac(url, hmac) {
    const urlObj = new URL(url, 'http://localhost');
    const params = new URLSearchParams(urlObj.search);
    
    // Remove hmac and signature from params
    params.delete('hmac');
    params.delete('signature');
    
    // Sort params alphabetically
    const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    
    // Calculate HMAC
    const hash = crypto
        .createHmac('sha256', Meteor.settings.private.oauth.shopify.apiSecret)
        .update(sortedParams)
        .digest('hex');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(hmac)
    );
}

/**
 * Exchange authorization code for access token
 * @param {string} shop - Shop domain
 * @param {string} code - Authorization code
 * @returns {Promise<object>} Token response
 */
async function exchangeCodeForToken(shop, code) {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: Meteor.settings.private.oauth.shopify.apiKey,
            client_secret: Meteor.settings.private.oauth.shopify.apiSecret,
            code,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
    }

    return await response.json();
}

console.log('✅ Shopify OAuth routes initialized');
