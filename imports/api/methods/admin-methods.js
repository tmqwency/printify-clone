import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.methods({
    /**
     * Create admin user (can be called from console)
     */
    async 'admin.createAdminUser'() {
        const adminEmail = 'admin@printify.com';
        const existingAdmin = await Meteor.users.findOneAsync({ 'emails.address': adminEmail });

        if (existingAdmin) {
            return { success: false, message: 'Admin user already exists' };
        }

        const adminUserId = await Accounts.createUserAsync({
            email: adminEmail,
            password: 'admin123',
            profile: {
                name: 'Admin User',
                isAdmin: true
            }
        });

        return {
            success: true,
            message: 'Admin user created!',
            email: adminEmail,
            password: 'admin123'
        };
    },

    /**
     * Make current user an admin (for testing only)
     */
    async 'user.makeAdmin'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        await Meteor.users.updateAsync(this.userId, {
            $set: {
                'profile.isAdmin': true
            }
        });

        return { success: true, message: 'You are now an admin!' };
    },

    /**
     * Check if current user is admin
     */
    'user.isAdmin'() {
        if (!this.userId) {
            return false;
        }

        const user = Meteor.users.findOne(this.userId);
        return user?.profile?.isAdmin === true;
    },

    /**
     * Get system statistics for admin dashboard
     */
    async 'admin.getStats'() {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        const [
            totalUsers,
            totalOrders,
            orders,
            stores
        ] = await Promise.all([
            Meteor.users.find().countAsync(),
            Orders.find().countAsync(),
            Orders.find({}, { fields: { total: 1 } }).fetchAsync(),
            Stores.find({ status: { $ne: 'archived' } }).countAsync()
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        return {
            totalUsers,
            totalOrders,
            totalRevenue,
            activeStores: stores
        };
    },

    /**
     * Toggle admin role for a user
     */
    async 'admin.toggleRole'(targetUserId) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Prevent modifying own role
        if (targetUserId === userId) {
            throw new Meteor.Error('invalid-action', 'Cannot modify your own role');
        }

        const targetUser = await Meteor.users.findOneAsync(targetUserId);
        if (!targetUser) {
            throw new Meteor.Error('not-found', 'User not found');
        }

        const newStatus = !targetUser.profile?.isAdmin;

        await Meteor.users.updateAsync(targetUserId, {
            $set: {
                'profile.isAdmin': newStatus
            }
        });

        return { success: true, newStatus };
    },

    /**
     * Toggle ban status for a user
     */
    async 'admin.toggleBan'(targetUserId) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        const user = await Meteor.users.findOneAsync(userId);
        if (!user || !user.profile?.isAdmin) {
            throw new Meteor.Error('not-authorized', 'Admin access required');
        }

        // Prevent banning self
        if (targetUserId === userId) {
            throw new Meteor.Error('invalid-action', 'Cannot ban yourself');
        }

        const targetUser = await Meteor.users.findOneAsync(targetUserId);
        if (!targetUser) {
            throw new Meteor.Error('not-found', 'User not found');
        }

        const newStatus = !targetUser.profile?.isBanned;

        await Meteor.users.updateAsync(targetUserId, {
            $set: {
                'profile.isBanned': newStatus
            }
        });

        return { success: true, newStatus };
    }
});
