import { WebApp } from 'meteor/webapp';
import { Products } from '/imports/api/collections/products';
import { ProductVariants } from '/imports/api/collections/product-variants';
import { Designs } from '/imports/api/collections/designs';
import { Mockups } from '/imports/api/collections/mockups';
import { Orders } from '/imports/api/collections/orders';
import { OrderItems } from '/imports/api/collections/order-items';
import { PrintProviders } from '/imports/api/collections/print-providers';
import { Subscriptions } from '/imports/api/collections/subscriptions';
import {
    authenticateAPI,
    rateLimiter,
    corsMiddleware,
    errorHandler,
    sendJSON,
    jsonParser
} from './middleware';

const router = WebApp.connectHandlers;

// Apply global middleware
router.use('/api', corsMiddleware);
router.use('/api', jsonParser);

// ============================================
// CATALOG ENDPOINTS (Public - No Auth Required)
// ============================================

// GET /api/v1/catalog/products - List all available products
router.use('/api/v1/catalog/products', async (req, res) => {
    if (req.method !== 'GET') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const products = await Products.find({ status: 'active' }).fetchAsync();
        sendJSON(res, 200, { data: products });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// GET /api/v1/catalog/products/:id/variants - Get product variants
router.use('/api/v1/catalog/products/:id/variants', async (req, res) => {
    if (req.method !== 'GET') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const productId = req.url.split('/')[4];
        const variants = await ProductVariants.find({
            productId,
            status: 'active'
        }).fetchAsync();

        sendJSON(res, 200, { data: variants });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// GET /api/v1/catalog/providers - List print providers
router.use('/api/v1/catalog/providers', async (req, res) => {
    if (req.method !== 'GET') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const providers = await PrintProviders.find({ status: 'active' }).fetchAsync();
        sendJSON(res, 200, { data: providers });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

// Apply authentication and rate limiting to all authenticated routes
router.use('/api/v1/shops', authenticateAPI);
router.use('/api/v1/shops', rateLimiter(100, 60000)); // 100 req/min

// GET /api/v1/shops/me - Get current shop details
router.use('/api/v1/shops/me', async (req, res) => {
    if (req.method !== 'GET') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const subscription = await Subscriptions.findOneAsync({ storeId: req.store._id });

        sendJSON(res, 200, {
            data: {
                id: req.store._id,
                name: req.store.name,
                platform: req.store.platform,
                status: req.store.status,
                subscription: {
                    tier: subscription?.planTier,
                    usage: subscription?.usage,
                    limits: subscription?.limits
                }
            }
        });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// ============================================
// DESIGNS ENDPOINTS
// ============================================

router.use('/api/v1/designs', authenticateAPI);
router.use('/api/v1/designs', rateLimiter(100, 60000));

// GET /api/v1/designs - List designs
router.use('/api/v1/designs', async (req, res) => {
    if (req.method === 'GET') {
        try {
            const designs = await Designs.find({
                storeId: req.store._id,
                status: { $ne: 'failed' }
            }).fetchAsync();

            sendJSON(res, 200, { data: designs });
        } catch (error) {
            errorHandler(error, req, res);
        }
    } else if (req.method === 'POST') {
        // POST /api/v1/designs - Create design
        try {
            const { name, fileUrl, fileType, width, height } = req.body;

            if (!name || !fileUrl || !fileType) {
                sendJSON(res, 400, {
                    error: 'Bad Request',
                    message: 'name, fileUrl, and fileType are required'
                });
                return;
            }

            const designId = await Designs.insertAsync({
                storeId: req.store._id,
                userId: req.userId,
                name,
                originalFileUrl: fileUrl,
                fileType,
                width: width || 0,
                height: height || 0,
                fileSize: 0,
                status: 'draft',
                dpiValid: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const design = await Designs.findOneAsync(designId);
            sendJSON(res, 201, { data: design });
        } catch (error) {
            errorHandler(error, req, res);
        }
    } else {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
    }
});

// ============================================
// ORDERS ENDPOINTS
// ============================================

router.use('/api/v1/orders', authenticateAPI);
router.use('/api/v1/orders', rateLimiter(100, 60000));

// GET /api/v1/orders - List orders
// POST /api/v1/orders - Create order
router.use('/api/v1/orders', async (req, res) => {
    if (req.method === 'GET') {
        try {
            const { status, limit = 50, page = 1 } = req.query || {};
            const query = { storeId: req.store._id };

            if (status) {
                query.status = status;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const orders = await Orders.find(query, {
                limit: parseInt(limit),
                skip,
                sort: { createdAt: -1 }
            }).fetchAsync();

            const total = await Orders.find(query).countAsync();

            sendJSON(res, 200, {
                data: orders,
                meta: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            errorHandler(error, req, res);
        }
    } else if (req.method === 'POST') {
        try {
            const {
                externalOrderId,
                customerEmail,
                customerName,
                shippingAddress,
                items
            } = req.body;

            if (!externalOrderId || !customerEmail || !items || items.length === 0) {
                sendJSON(res, 400, {
                    error: 'Bad Request',
                    message: 'externalOrderId, customerEmail, and items are required'
                });
                return;
            }

            // Create order
            const orderId = await Orders.insertAsync({
                storeId: req.store._id,
                externalOrderId,
                platform: req.store.platform,
                customerEmail,
                customerName: customerName || '',
                shippingAddress,
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
            for (const item of items) {
                const itemTotal = item.quantity * item.unitPrice;
                subtotal += itemTotal;

                await OrderItems.insertAsync({
                    orderId,
                    productId: item.productId,
                    productVariantId: item.variantId,
                    designId: item.designId,
                    productName: item.productName || '',
                    variantName: item.variantName || '',
                    sku: item.sku || '',
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
                    total: subtotal
                }
            });

            const order = await Orders.findOneAsync(orderId);
            sendJSON(res, 201, { data: order });
        } catch (error) {
            errorHandler(error, req, res);
        }
    } else {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
    }
});

// GET /api/v1/orders/:id - Get order details
router.use('/api/v1/orders/:id', authenticateAPI, async (req, res) => {
    if (req.method !== 'GET') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const orderId = req.url.split('/')[4].split('?')[0];
        const order = await Orders.findOneAsync({
            _id: orderId,
            storeId: req.store._id
        });

        if (!order) {
            sendJSON(res, 404, { error: 'Not Found', message: 'Order not found' });
            return;
        }

        const items = await OrderItems.find({ orderId }).fetchAsync();

        sendJSON(res, 200, {
            data: {
                ...order,
                items
            }
        });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// ============================================
// MOCKUPS ENDPOINTS
// ============================================

router.use('/api/v1/mockups', authenticateAPI);
router.use('/api/v1/mockups', rateLimiter(50, 60000));

// POST /api/v1/mockups - Generate mockup
router.use('/api/v1/mockups', async (req, res) => {
    if (req.method !== 'POST') {
        sendJSON(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const { designId, variantId } = req.body;

        if (!designId || !variantId) {
            sendJSON(res, 400, {
                error: 'Bad Request',
                message: 'designId and variantId are required'
            });
            return;
        }

        const mockupId = await Mockups.insertAsync({
            designId,
            productVariantId: variantId,
            storeId: req.store._id,
            status: 'pending',
            generatedBy: 'server',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const mockup = await Mockups.findOneAsync(mockupId);
        sendJSON(res, 201, { data: mockup });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

console.log('✅ REST API routes initialized');
console.log('📡 API Base URL: /api/v1');
console.log('🔐 Authentication: X-API-Key and X-API-Secret headers');
