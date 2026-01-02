import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Stores } from '../collections/stores';

Meteor.methods({
    /**
     * Register Shopify webhooks for a store
     */
    async 'shopify.registerWebhooks'(storeId) {
        check(storeId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        const store = await Stores.findOneAsync({
            _id: storeId,
            userId: this.userId,
            platform: 'shopify'
        });

        if (!store) {
            throw new Meteor.Error('not-found', 'Store not found');
        }

        const webhooks = [
            {
                topic: 'orders/create',
                address: `${Meteor.absoluteUrl()}api/shopify/webhooks/orders/create`
            },
            {
                topic: 'orders/updated',
                address: `${Meteor.absoluteUrl()}api/shopify/webhooks/orders/update`
            }
        ];

        const registeredWebhooks = [];

        for (const webhook of webhooks) {
            try {
                const url = `https://${store.platformStoreId}/admin/api/2024-01/webhooks.json`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': store.accessToken
                    },
                    body: JSON.stringify({
                        webhook: {
                            topic: webhook.topic,
                            address: webhook.address,
                            format: 'json'
                        }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ Failed to register webhook ${webhook.topic}:`, errorText);
                    continue;
                }

                const data = await response.json();
                registeredWebhooks.push(data.webhook);
                console.log(`✅ Registered webhook: ${webhook.topic}`);

            } catch (error) {
                console.error(`❌ Error registering webhook ${webhook.topic}:`, error);
            }
        }

        // Store webhook IDs in the store record
        await Stores.updateAsync(storeId, {
            $set: {
                webhooks: registeredWebhooks.map(w => ({
                    id: w.id.toString(),
                    topic: w.topic,
                    address: w.address
                }))
            }
        });

        return {
            success: true,
            webhooksRegistered: registeredWebhooks.length
        };
    }
});
