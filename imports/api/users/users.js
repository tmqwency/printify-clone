import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Extend Meteor.users with custom fields
Meteor.users.deny({
    update() { return true; },
    remove() { return true; }
});

// Helper to check if user has role
export const userHasRole = async (userId, role) => {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.roles && user.roles.includes(role);
};

// Helper to require authentication
export const requireAuth = function () {
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    return this.userId;
};

// Helper to require specific role
export const requireRole = async function (role) {
    const userId = requireAuth.call(this);
    if (!(await userHasRole(userId, role))) {
        throw new Meteor.Error('not-authorized', `${role} access required`);
    }
    return userId;
};

// Helper to get user's stores
export const getUserStores = async (userId) => {
    const { Stores } = require('../collections/stores');
    return await Stores.find({ userId }).fetchAsync();
};

// Helper to verify store ownership
export const verifyStoreOwnership = async (userId, storeId) => {
    const { Stores } = require('../collections/stores');
    const store = await Stores.findOneAsync({ _id: storeId, userId });
    if (!store) {
        throw new Meteor.Error('not-found', 'Store not found or access denied');
    }
    return store;
};
