import { Meteor } from 'meteor/meteor';
import { FulfillmentJobs } from '/imports/api/collections/fulfillment-jobs';
import { Orders } from '/imports/api/collections/orders';
import { OrderItems } from '/imports/api/collections/order-items';
import { PrintProviders } from '/imports/api/collections/print-providers';
import { ProductVariants } from '/imports/api/collections/product-variants';
import { Products } from '/imports/api/collections/products';

/**
 * Fulfillment Queue Processor
 * Processes pending fulfillment jobs and routes them to print providers
 */
class FulfillmentQueue {
    constructor() {
        this.isProcessing = false;
        this.processingInterval = null;
    }

    /**
     * Start the queue processor
     */
    start(intervalMs = 30000) { // Process every 30 seconds
        if (this.processingInterval) {
            console.log('⚠️  Fulfillment queue already running');
            return;
        }

        console.log('🚀 Starting fulfillment queue processor...');
        this.processingInterval = Meteor.setInterval(() => {
            this.processQueue();
        }, intervalMs);

        // Process immediately on start
        this.processQueue();
    }

    /**
     * Stop the queue processor
     */
    stop() {
        if (this.processingInterval) {
            Meteor.clearInterval(this.processingInterval);
            this.processingInterval = null;
            console.log('⏹️  Fulfillment queue stopped');
        }
    }

    /**
     * Process pending jobs in the queue
     */
    async processQueue() {
        if (this.isProcessing) {
            console.log('⏭️  Queue already processing, skipping...');
            return;
        }

        this.isProcessing = true;

        try {
            // Get pending jobs
            const pendingJobs = await FulfillmentJobs.find({
                status: 'pending',
                attempts: { $lt: 3 } // Max 3 attempts
            }, {
                limit: 10, // Process 10 at a time
                sort: { createdAt: 1 } // Oldest first
            }).fetchAsync();

            if (pendingJobs.length === 0) {
                return;
            }

            console.log(`📦 Processing ${pendingJobs.length} fulfillment jobs...`);

            for (const job of pendingJobs) {
                await this.processJob(job);
            }

            console.log(`✅ Processed ${pendingJobs.length} jobs`);
        } catch (error) {
            console.error('❌ Error processing fulfillment queue:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a single fulfillment job
     */
    async processJob(job) {
        try {
            console.log(`🔄 Processing job ${job._id}...`);

            // Update job status to processing
            await FulfillmentJobs.updateAsync(job._id, {
                $set: {
                    status: 'processing',
                    lastAttemptAt: new Date(),
                    updatedAt: new Date()
                },
                $inc: { attempts: 1 }
            });

            // Get order item details
            const orderItem = await OrderItems.findOneAsync(job.orderItemId);
            if (!orderItem) {
                throw new Error('Order item not found');
            }

            // Get product and variant details
            const variant = await ProductVariants.findOneAsync(orderItem.productVariantId);
            const product = await Products.findOneAsync(orderItem.productId);

            if (!variant || !product) {
                throw new Error('Product or variant not found');
            }

            // Get print provider
            const provider = await PrintProviders.findOneAsync(product.printProviderId);
            if (!provider) {
                throw new Error('Print provider not found');
            }

            // Route to provider (mock implementation)
            const fulfillmentResult = await this.routeToProvider(
                provider,
                product,
                variant,
                orderItem,
                job
            );

            // Update job as completed
            await FulfillmentJobs.updateAsync(job._id, {
                $set: {
                    status: 'completed',
                    printProviderId: provider._id,
                    providerOrderId: fulfillmentResult.providerOrderId,
                    completedAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // Update order item status
            await OrderItems.updateAsync(orderItem._id, {
                $set: {
                    fulfillmentStatus: 'processing',
                    printProviderId: provider._id,
                    updatedAt: new Date()
                }
            });

            // Check if all items in order are processing/completed
            const order = await Orders.findOneAsync(job.orderId);
            const allItems = await OrderItems.find({ orderId: job.orderId }).fetchAsync();
            const allProcessing = allItems.every(item =>
                ['processing', 'shipped', 'fulfilled'].includes(item.fulfillmentStatus)
            );

            if (allProcessing && order.status === 'created') {
                await Orders.updateAsync(job.orderId, {
                    $set: {
                        status: 'processing',
                        updatedAt: new Date()
                    }
                });
            }

            console.log(`✅ Job ${job._id} completed`);
        } catch (error) {
            console.error(`❌ Job ${job._id} failed:`, error.message);

            // Update job with error
            const updateData = {
                $set: {
                    errorMessage: error.message,
                    lastAttemptAt: new Date(),
                    updatedAt: new Date()
                }
            };

            // Mark as failed if max attempts reached
            if (job.attempts >= 2) { // Will be 3 after this attempt
                updateData.$set.status = 'failed';
                updateData.$set.failedAt = new Date();
            } else {
                updateData.$set.status = 'pending'; // Retry
            }

            await FulfillmentJobs.updateAsync(job._id, updateData);
        }
    }

    /**
     * Route job to print provider
     * In production, this would make actual API calls to the provider
     */
    async routeToProvider(provider, product, variant, orderItem, job) {
        console.log(`📤 Routing to provider: ${provider.name}`);

        // Mock provider API call
        // In production, this would:
        // 1. Upload design files to provider
        // 2. Create print job with provider
        // 3. Get provider order ID
        // 4. Return tracking information

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock successful response
        return {
            providerOrderId: `${provider.name.toLowerCase()}_${Date.now()}`,
            status: 'accepted',
            estimatedShipDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
        };
    }

    /**
     * Retry failed jobs
     */
    async retryFailedJobs() {
        console.log('🔄 Retrying failed jobs...');

        const failedJobs = await FulfillmentJobs.find({
            status: 'failed',
            attempts: { $lt: 3 }
        }).fetchAsync();

        for (const job of failedJobs) {
            await FulfillmentJobs.updateAsync(job._id, {
                $set: {
                    status: 'pending',
                    errorMessage: null,
                    updatedAt: new Date()
                }
            });
        }

        console.log(`✅ Reset ${failedJobs.length} failed jobs to pending`);
    }
}

// Create singleton instance
export const fulfillmentQueue = new FulfillmentQueue();

// Start queue on server startup
if (Meteor.isServer) {
    Meteor.startup(() => {
        // Start processing queue after 5 seconds
        Meteor.setTimeout(() => {
            fulfillmentQueue.start(30000); // Process every 30 seconds
        }, 5000);
    });
}
