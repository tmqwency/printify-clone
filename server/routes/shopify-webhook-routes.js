import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import crypto from 'crypto';
import { Orders } from '../../imports/api/collections/orders';
import { Stores } from '../../imports/api/collections/stores';
import { UserProducts } from '../../imports/api/collections/UserProducts';
import { Notifications } from '../../imports/api/collections/notifications';
import { OrderItems } from '../../imports/api/collections/order-items';
import { FulfillmentJobs } from '../../imports/api/collections/fulfillment-jobs';

/**
 * Verify Shopify webhook HMAC signature
 */
function verifyShopifyWebhook(body, hmacHeader, secret) {
    const hash = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');
    
    return hash === hmacHeader;
}

/**
 * Shopify Order Webhook Handler
 * Receives orders from Shopify when they are created
 */

// Debug handler to catch misconfigured webhooks pointing to root
WebApp.connectHandlers.use('/', (req, res, next) => {
    if (req.method === 'POST' && req.url === '/') {
        console.warn('⚠️  Received POST at root (/). You likely forgot to add the full path to your Shopify Webhook URL!');
        console.warn('   Expected: /api/shopify/webhooks/orders/create');
    }
    next();
});

WebApp.connectHandlers.use((req, res, next) => {
    // Only handle our specific webhook path
    if (req.url !== '/api/shopify/webhooks/orders/create') {
        return next();
    }

    console.log('📦 Received Shopify order webhook');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // Only accept POST requests
    if (req.method !== 'POST') {
        console.error('❌ Method not allowed:', req.method);
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
    }

    // Read the raw body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            console.log('📝 Body received, length:', body.length);

            // Get HMAC header
            const hmacHeader = req.headers['x-shopify-hmac-sha256'];
            const shopDomain = req.headers['x-shopify-shop-domain'];

            console.log('Shop domain:', shopDomain);
            console.log('HMAC present:', !!hmacHeader);

            if (!hmacHeader || !shopDomain) {
                console.error('❌ Missing required headers');
                res.writeHead(400);
                res.end('Bad Request');
                return;
            }

            // Find the store
            const store = await Stores.findOneAsync({
                platformStoreId: shopDomain,
                platform: 'shopify'
            });

            if (!store) {
                console.error('❌ Store not found:', shopDomain);
                res.writeHead(404);
                res.end('Store not found');
                return;
            }

            console.log('✅ Store found:', store._id);

            // Verify webhook authenticity
            // Use the specific webhook secret if available, otherwise fallback to API secret (for older/private apps)
            const webhookSecret = Meteor.settings.private.oauth.shopify.webhookSecret || Meteor.settings.private.oauth.shopify.apiSecret;
            
            console.log('🔐 Verifying with secret starts with:', webhookSecret.substring(0, 4) + '...');
            
            const isValid = verifyShopifyWebhook(body, hmacHeader, webhookSecret);

            if (!isValid) {
                console.error('❌ Invalid webhook signature');
                console.error('   Expected HMAC header:', hmacHeader);
                // Don't log full body/secret for security, but good to know it failed
                res.writeHead(401);
                res.end('Unauthorized');
                return;
            }

            console.log('✅ HMAC verified');

            // Parse order data
            const orderData = JSON.parse(body);
            console.log('✅ Valid webhook received for order:', orderData.id);

            // Extract line items and match to our products
            const lineItems = [];
            for (const item of orderData.line_items) {
                // Try to find the product in our database by Shopify Product ID
                const userProduct = await UserProducts.findOneAsync({
                    'shopifyProducts.shopifyProductId': item.product_id?.toString()
                });

                // Even if we don't find a match (e.g. test order), we still want to show the item
                lineItems.push({
                    productId: userProduct?._id || null, // internal ID if found
                    productName: item.name || item.title || 'Unknown Product',
                    variantTitle: item.variant_title || '',
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price) * 100, // Convert to cents
                    sku: item.sku || '',
                    shopifyProductId: item.product_id?.toString(),
                    shopifyVariantId: item.variant_id?.toString(),
                    image: userProduct?.previewImages?.front || null // Try to get image from our DB
                });
            }

            // Create order in our database
            const order = {
                userId: store.userId,
                storeId: store._id,
                platform: 'shopify',
                externalOrderId: orderData.id.toString(),
                orderNumber: (orderData.order_number || orderData.name || 'Unknown').toString(),
                
                // Customer info - Flattened for UI compatibility
                customerName: orderData.customer 
                    ? `${orderData.customer.first_name || ''} ${orderData.customer.last_name || ''}`.trim() || 'Guest'
                    : orderData.email || 'Guest',
                customerEmail: orderData.customer?.email || orderData.email || '',
                customerPhone: orderData.customer?.phone || '',
                
                // Keep nested object for detailed storage if needed, but UI uses flat fields
                customer: {
                    name: orderData.customer 
                        ? `${orderData.customer.first_name || ''} ${orderData.customer.last_name || ''}`.trim() || 'Guest'
                        : orderData.email || 'Guest',
                    email: orderData.customer?.email || orderData.email || '',
                    phone: orderData.customer?.phone || ''
                },
                
                // Shipping address
                shippingAddress: orderData.shipping_address ? {
                    name: `${orderData.shipping_address.first_name || ''} ${orderData.shipping_address.last_name || ''}`.trim(),
                    address1: orderData.shipping_address.address1 || '',
                    address2: orderData.shipping_address.address2 || '',
                    city: orderData.shipping_address.city || '',
                    province: orderData.shipping_address.province || '',
                    country: orderData.shipping_address.country || '',
                    zip: orderData.shipping_address.zip || '',
                    phone: orderData.shipping_address.phone || ''
                } : null,
                
                // Line items
                items: lineItems,
                
                // Pricing
                subtotal: parseFloat(orderData.subtotal_price || 0) * 100,
                shipping: parseFloat(orderData.total_shipping_price_set?.shop_money?.amount || 0) * 100,
                tax: parseFloat(orderData.total_tax || 0) * 100,
                total: parseFloat(orderData.total_price || 0) * 100,
                
                // Status
                status: 'pending', // Our internal status
                fulfillmentStatus: orderData.fulfillment_status || 'unfulfilled',
                financialStatus: orderData.financial_status || 'pending',
                
                // Metadata
                createdAt: new Date(orderData.created_at || new Date()),
                updatedAt: new Date(),
                shopifyData: {
                    tags: orderData.tags,
                    note: orderData.note,
                    currency: orderData.currency
                }
            };

            // Verify constructed order object
            console.log('🛠 Debug - Customer Data Check:');
            console.log('   customerName:', order.customerName);
            console.log('   customerEmail:', order.customerEmail);
            console.log('   customer keys:', Object.keys(order.customer || {}));

            // Idempotency check: Check if order already exists
            const existingOrder = await Orders.findOneAsync({
                externalOrderId: orderData.id.toString(),
                platform: 'shopify'
            });

            let orderId;
            let isNewOrder = false;

            if (existingOrder) {
                console.log('ℹ️ Order already exists, updating:', existingOrder._id);
                // Update existing order with latest data
                await Orders.updateAsync(existingOrder._id, {
                    $set: {
                        ...order,
                        customerName: order.customerName,   // Explicitly set these again just to be safe
                        customerEmail: order.customerEmail, // Explicitly set these again just to be safe
                        updatedAt: new Date()
                    }
                });
                orderId = existingOrder._id;
            } else {
                // Insert new order
                orderId = await Orders.insertAsync(order);
                isNewOrder = true;
                
                // Insert Order Items and Fulfillment Jobs (Critical for UI display)
                for (const item of lineItems) {
                    const orderItemId = await OrderItems.insertAsync({
                        orderId: orderId,
                        productId: item.productId || 'external', // Use 'external' if not linked
                        productVariantId: item.shopifyVariantId || 'default',
                        designId: item.productId || 'external',
                        productName: item.productName,
                        variantName: item.variantTitle,
                        sku: item.sku,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: item.price * item.quantity,
                        fulfillmentStatus: 'pending',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // Create Fulfillment Job
                    await FulfillmentJobs.insertAsync({
                        orderId: orderId,
                        orderItemId: orderItemId,
                        storeId: store._id,
                        status: 'pending',
                        attempts: 0,
                        maxAttempts: 3,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
                
                console.log('✅ Order created in database:', orderId);
            }

            console.log('   Items count:', lineItems.length);
            console.log('   Customer:', order.customer.name);

            // Create in-app notification only for new orders
            if (isNewOrder) {
                await Notifications.insertAsync({
                    userId: store.userId,
                    type: 'order_received',
                    title: 'New Shopify Order',
                    message: `Order #${order.orderNumber} from ${store.name || 'Shopify'} has been received.`,
                    data: {
                        orderId: orderId,
                        storeId: store._id,
                        externalOrderId: order.externalOrderId,
                        amount: (order.total / 100).toFixed(2)
                    },
                    read: false,
                    createdAt: new Date()
                });
                console.log('🔔 Notification created for user:', store.userId);
            } else {
                console.log('🔕 Skipping notification for existing order');
            }

            // Respond to Shopify
            res.writeHead(200);
            res.end('OK');

        } catch (error) {
            console.error('❌ Error processing webhook:', error);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
    });
});

/**
 * Shopify Order Update Webhook Handler
 */
WebApp.connectHandlers.use('/api/shopify/webhooks/orders/update', async (req, res) => {
    console.log('🔄 Received Shopify order update webhook');

    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
    }

    try {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        await new Promise((resolve) => req.on('end', resolve));

        const hmacHeader = req.headers['x-shopify-hmac-sha256'];
        const shopDomain = req.headers['x-shopify-shop-domain'];

        if (!hmacHeader || !shopDomain) {
            res.writeHead(400);
            res.end('Bad Request');
            return;
        }

        const apiSecret = Meteor.settings.private.oauth.shopify.apiSecret;
        const isValid = verifyShopifyWebhook(body, hmacHeader, apiSecret);

        if (!isValid) {
            res.writeHead(401);
            res.end('Unauthorized');
            return;
        }

        const orderData = JSON.parse(body);
        console.log('✅ Valid update webhook for order:', orderData.id);

        // Update existing order
        await Orders.updateAsync(
            { externalOrderId: orderData.id.toString() },
            {
                $set: {
                    fulfillmentStatus: orderData.fulfillment_status || 'unfulfilled',
                    financialStatus: orderData.financial_status,
                    updatedAt: new Date()
                }
            }
        );

        console.log('✅ Order updated:', orderData.id);

        res.writeHead(200);
        res.end('OK');

    } catch (error) {
        console.error('❌ Error processing update webhook:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

console.log('✅ Shopify webhook routes registered');
