import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import crypto from 'crypto';
import { UserRoles } from '../schemas/common';
import { Stores } from '../collections/stores';
import { AuditLogs } from '../collections/audit-logs';

Meteor.methods({
    /**
     * Generate API token for a store
     */
    async 'auth.generateApiToken'(storeId) {
        check(storeId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        // Verify store ownership
        const store = await Stores.findOneAsync({ _id: storeId, userId: this.userId });
        if (!store) {
            throw new Meteor.Error('not-found', 'Store not found');
        }

        // Generate API key and secret
        const apiKey = `pk_${crypto.randomBytes(16).toString('hex')}`;
        const apiSecret = `sk_${crypto.randomBytes(32).toString('hex')}`;

        // Update store
        await Stores.updateAsync(storeId, {
            $set: {
                apiKey,
                apiSecret,
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'api_token_generated',
            resourceType: 'store',
            resourceId: storeId,
            storeId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { apiKey, apiSecret };
    },

    /**
     * Revoke API token for a store
     */
    async 'auth.revokeApiToken'(storeId) {
        check(storeId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        // Verify store ownership
        const store = await Stores.findOneAsync({ _id: storeId, userId: this.userId });
        if (!store) {
            throw new Meteor.Error('not-found', 'Store not found');
        }

        // Remove API credentials
        await Stores.updateAsync(storeId, {
            $unset: {
                apiKey: '',
                apiSecret: ''
            },
            $set: {
                updatedAt: new Date()
            }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'api_token_revoked',
            resourceType: 'store',
            resourceId: storeId,
            storeId,
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Check if user has specific role
     */
    async 'auth.hasRole'(role) {
        check(role, String);

        if (!this.userId) {
            return false;
        }

        const user = await Meteor.users.findOneAsync(this.userId);
        return user && user.roles && user.roles.includes(role);
    },

    /**
     * Assign role to user (admin only)
     */
    async 'auth.assignRole'(userId, role) {
        check(userId, String);
        check(role, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        // Check if current user is admin
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        if (!currentUser || !currentUser.roles || !currentUser.roles.includes(UserRoles.ADMIN)) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Validate role
        if (!Object.values(UserRoles).includes(role)) {
            throw new Meteor.Error('invalid-role', 'Invalid role');
        }

        // Update user roles
        await Meteor.users.updateAsync(userId, {
            $addToSet: { roles: role },
            $set: { updatedAt: new Date() }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'role_assigned',
            resourceType: 'user',
            resourceId: userId,
            changes: { role },
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Remove role from user (admin only)
     */
    async 'auth.removeRole'(userId, role) {
        check(userId, String);
        check(role, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        // Check if current user is admin
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        if (!currentUser || !currentUser.roles || !currentUser.roles.includes(UserRoles.ADMIN)) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Update user roles
        await Meteor.users.updateAsync(userId, {
            $pull: { roles: role },
            $set: { updatedAt: new Date() }
        });

        // Log action
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'role_removed',
            resourceType: 'user',
            resourceId: userId,
            changes: { role },
            status: 'success',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    },

    /**
     * Update user profile
     */
    async 'auth.updateProfile'(profileData) {
        check(profileData, {
            name: Match.Optional(String),
            company: Match.Optional(String),
            phone: Match.Optional(String)
        });

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        await Meteor.users.updateAsync(this.userId, {
            $set: {
                'profile.name': profileData.name,
                'profile.company': profileData.company,
                'profile.phone': profileData.phone,
                updatedAt: new Date()
            }
        });

        return true;
    }
});
