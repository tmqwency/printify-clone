import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import { Stores } from '/imports/api/collections/stores';

// Rate limiting store
const rateLimitStore = new Map();

// API Authentication Middleware
export const authenticateAPI = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Unauthorized',
            message: 'API key and secret are required'
        }));
        return;
    }

    // Find store by API credentials
    const store = await Stores.findOneAsync({ apiKey, apiSecret, status: 'active' });

    if (!store) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid API credentials'
        }));
        return;
    }

    // Attach store to request
    req.store = store;
    req.userId = store.userId;
    next();
};

// Rate Limiting Middleware
export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
    return (req, res, next) => {
        const key = req.store?._id || req.ip;
        const now = Date.now();

        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }

        const record = rateLimitStore.get(key);

        if (now > record.resetTime) {
            // Reset the window
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }

        if (record.count >= maxRequests) {
            res.writeHead(429, {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': maxRequests,
                'X-RateLimit-Remaining': 0,
                'X-RateLimit-Reset': record.resetTime
            });
            res.end(JSON.stringify({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000} seconds.`
            }));
            return;
        }

        record.count++;
        rateLimitStore.set(key, record);

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
        res.setHeader('X-RateLimit-Reset', record.resetTime);

        next();
    };
};

// CORS Middleware
export const corsMiddleware = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-API-Secret, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    next();
};

// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        error: err.name || 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }));
};

// JSON Response Helper
export const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// Parse JSON body
export const jsonParser = bodyParser.json();
