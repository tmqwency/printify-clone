import { WebApp } from 'meteor/webapp';
import { Stores } from '../collections/stores';
import { UserProducts } from '../collections/UserProducts';
import { Orders } from '../collections/orders';
import { OrderItems } from '../collections/order-items';
import { FulfillmentJobs } from '../collections/fulfillment-jobs';
import { Meteor } from 'meteor/meteor';
import { findBestProvider, calculateProviderCost } from '../lib/provider-assignment';

// Middleware to parse JSON body
WebApp.connectHandlers.use('/api/v1', (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
                next();
            } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        next();
    }
});

// Authentication Middleware
const authenticateRequest = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Missing or invalid Authorization header' }));
        return null;
    }

    const apiKey = authHeader.split(' ')[1];
    const store = await Stores.findOneAsync({ apiKey, status: { $ne: 'disconnected' } });

    if (!store) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Invalid API Key' }));
        return null;
    }

    // Track API Usage
    const { Subscriptions } = await import('../collections/subscriptions');
    const subscription = await Subscriptions.findOneAsync({ userId: store.userId }, { sort: { updatedAt: -1 } });

    if (subscription) {
        // Increment usage
        await Subscriptions.updateAsync(subscription._id, {
            $inc: { 'usage.apiCallsThisMonth': 1 }
        });

        // Check limits (soft limit for now, or strict?)
        // Let's enforce it to match user expectation of "limits"
        const { limits, usage } = subscription;
        if (limits.maxApiCalls !== -1 && usage.apiCallsThisMonth >= limits.maxApiCalls) {
             res.statusCode = 429;
             res.end(JSON.stringify({ error: 'API rate limit exceeded for your plan' }));
             return null;
        }
    }

    return store;
};

// Routes
WebApp.connectHandlers.use('/api/v1/products', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');

    const store = await authenticateRequest(req, res);
    if (!store) return;

    if (req.method === 'GET') {
        try {
            // Get all published custom products for this user
            const products = await UserProducts.find({ 
                userId: store.userId,
                status: 'published'
            }).fetchAsync();

            const formattedProducts = products.map(p => {
                // Get main image from previewImages (prefer 'front', fallback to first available)
                let imageUrl = null;
                if (p.previewImages) {
                    imageUrl = p.previewImages.front || Object.values(p.previewImages)[0];
                }

                return {
                    id: p._id,
                    title: p.name,
                    description: p.description,
                    price: p.price,
                    image_url: imageUrl,
                    images: p.previewImages ? Object.values(p.previewImages) : [],
                    variants: p.variants || [],
                    created_at: p.createdAt,
                    updated_at: p.updatedAt
                };
            });

            res.statusCode = 200;
            res.end(JSON.stringify({
                success: true,
                data: formattedProducts,
                meta: {
                    count: formattedProducts.length,
                    store: store.name
                }
            }));
        } catch (error) {
            console.error('API Error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }
});

WebApp.connectHandlers.use('/api/v1/orders', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');

    const store = await authenticateRequest(req, res);
    if (!store) return;

    if (req.method === 'GET') {
        try {
            // Get orders for this store
            const orders = await Orders.find({ storeId: store._id }).fetchAsync();

            res.statusCode = 200;
            res.end(JSON.stringify({
                success: true,
                data: orders
            }));
        } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else if (req.method === 'POST') {
        // Create new order
        try {
            const orderData = req.body;

            // Basic validation
            if (!orderData.external_order_id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing external_order_id' }));
                return;
            }
            if (!orderData.shipping_address) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing shipping_address' }));
                return;
            }
            if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid or empty items array' }));
                return;
            }

            // Verify duplicate order
            const existingOrder = await Orders.findOneAsync({
                storeId: store._id,
                externalOrderId: orderData.external_order_id
            });

            if (existingOrder) {
                res.statusCode = 409;
                res.end(JSON.stringify({ error: 'Order already exists' }));
                return;
            }

            // Validate and prepare items
            let subtotal = 0;
            const validItems = [];

            for (const item of orderData.items) {
                // Find User Product (Custom ID)
                const userProduct = await UserProducts.findOneAsync(item.product_id);

                if (!userProduct) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: `Product not found: ${item.product_id}` }));
                    return;
                }

                // Security Check: Product must belong to the API Key owner
                if (userProduct.userId !== store.userId) {
                    res.statusCode = 403;
                    res.end(JSON.stringify({ error: `Access denied for product: ${item.product_id}` }));
                    return;
                }

                const price = userProduct.price || 0;
                const quantity = item.quantity || 1;
                const itemTotal = price * quantity;

                subtotal += itemTotal;

                validItems.push({
                    userProduct,
                    quantity,
                    price,
                    itemTotal,
                    variantId: item.variant_id // Store generic variant ID request
                });
            }

            const shippingCost = 500; // Flat rate $5.00
            const total = subtotal + shippingCost;

            // Create Order
            const orderId = await Orders.insertAsync({
                storeId: store._id,
                externalOrderId: orderData.external_order_id,
                platform: 'api',
                // Map fields from API payload
                customerEmail: orderData.customer?.email || '',
                customerName: orderData.customer?.name || '',
                shippingAddress: orderData.shipping_address,
                status: 'created',
                subtotal,
                shippingCost,
                tax: 0,
                total,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Create Order Items and Fulfillment Jobs
            for (const validItem of validItems) {
                const { userProduct, quantity, price, itemTotal, variantId } = validItem;

                const orderItemId = await OrderItems.insertAsync({
                    orderId,
                    productId: userProduct._id, // The UserProduct ID acts as the identifier
                    productVariantId: variantId || 'default', // Fallback
                    designId: userProduct._id,
                    productName: userProduct.name,
                    sku: userProduct.baseProductId, // Using base as SKU reference for now
                    quantity,
                    unitPrice: price,
                    totalPrice: itemTotal,
                    fulfillmentStatus: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await FulfillmentJobs.insertAsync({
                    orderId,
                    orderItemId,
                    storeId: store._id,
                    status: 'pending',
                    attempts: 0,
                    maxAttempts: 3,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Auto-assign provider
            const order = await Orders.findOneAsync(orderId);
            const bestProvider = await findBestProvider(order, 'balanced');

            let providerCost = 0;
            let assignedProviderId = null;

            if (bestProvider) {
                providerCost = calculateProviderCost(bestProvider, order);
                assignedProviderId = bestProvider._id;

                // Update order with provider info
                await Orders.updateAsync(orderId, {
                    $set: {
                        assignedProviderId,
                        providerCost,
                        assignmentMethod: 'auto',
                        updatedAt: new Date()
                    }
                });
            }

            res.statusCode = 201;
            res.end(JSON.stringify({
                success: true,
                message: 'Order created successfully',
                order_id: orderId,
                external_order_id: orderData.external_order_id,
                assigned_provider: assignedProviderId
            }));

        } catch (error) {
            console.error('API Error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }
});
