import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Providers } from '../collections/Providers';

Meteor.methods({
    /**
     * Create a new provider (Admin only)
     */
    async 'providers.create'(providerData) {
        check(providerData, {
            name: String,
            description: String,
            logo: Match.Optional(String),
            location: {
                country: String,
                region: String,
                facilities: [String]
            },
            capabilities: {
                supportedProducts: [String],
                maxDailyCapacity: Number,
                currentCapacity: Number
            },
            pricing: {
                baseCost: Number,
                shippingRates: {
                    domestic: Number,
                    international: Number
                }
            },
            performance: {
                avgProductionTime: Number,
                qualityRating: Number,
                onTimeRate: Number
            },
            contact: {
                email: String,
                phone: Match.Optional(String),
                website: Match.Optional(String)
            }
        });

        // Check if user is admin
        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const providerId = await Providers.insertAsync({
            ...providerData,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return providerId;
    },

    /**
     * Update provider (Admin only)
     */
    async 'providers.update'(providerId, updates) {
        check(providerId, String);
        check(updates, Object);

        // Check if user is admin
        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const provider = await Providers.findOneAsync(providerId);
        if (!provider) {
            throw new Meteor.Error('not-found', 'Provider not found');
        }

        await Providers.updateAsync(providerId, {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        });

        return true;
    },

    /**
     * Delete provider (Admin only)
     */
    async 'providers.delete'(providerId) {
        check(providerId, String);

        // Check if user is admin
        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const provider = await Providers.findOneAsync(providerId);
        if (!provider) {
            throw new Meteor.Error('not-found', 'Provider not found');
        }

        await Providers.removeAsync(providerId);
        return true;
    },

    /**
     * Toggle provider status (Admin only)
     */
    async 'providers.toggleStatus'(providerId) {
        check(providerId, String);

        // Check if user is admin
        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const provider = await Providers.findOneAsync(providerId);
        if (!provider) {
            throw new Meteor.Error('not-found', 'Provider not found');
        }

        const newStatus = provider.status === 'active' ? 'inactive' : 'active';

        await Providers.updateAsync(providerId, {
            $set: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        return newStatus;
    },

    /**
     * Get provider by ID
     */
    async 'providers.getById'(providerId) {
        check(providerId, String);

        const provider = await Providers.findOneAsync(providerId);
        if (!provider) {
            throw new Meteor.Error('not-found', 'Provider not found');
        }

        return provider;
    },

    /**
     * List all providers
     */
    async 'providers.list'(filters = {}) {
        const query = {};

        if (filters.status && filters.status !== 'all') {
            query.status = filters.status;
        }

        if (filters.country) {
            query['location.country'] = filters.country;
        }

        return await Providers.find(query, {
            sort: { name: 1 }
        }).fetchAsync();
    }
});
