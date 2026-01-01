import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Notifications } from '../collections/notifications';

function requireAuth() {
    if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'You must be logged in to perform this action');
    }
    return this.userId;
}

Meteor.methods({
    /**
     * Create a notification (Internal use mostly)
     */
    async 'notifications.create'(data) {
        check(data, {
            userId: String,
            type: String,
            title: String,
            message: String,
            data: Match.Optional(Object)
        });

        // Security check: typically only server calls this, but if client does, ensure it's for self?
        // For simplicity, we allow client to create for self, or server for anyone.
        if (this.userId && this.userId !== data.userId) {
             throw new Meteor.Error('not-authorized', 'Cannot create notification for another user');
        }

        return await Notifications.insertAsync({
            ...data,
            read: false,
            createdAt: new Date()
        });
    },

    /**
     * List user's notifications (Recent 20)
     */
    async 'notifications.list'() {
        const userId = requireAuth.call(this);
        return await Notifications.find(
            { userId },
            { sort: { createdAt: -1 }, limit: 20 }
        ).fetchAsync();
    },

    /**
     * Get unread count
     */
    async 'notifications.unreadCount'() {
        const userId = requireAuth.call(this);
        return await Notifications.find({ userId, read: false }).countAsync();
    },

    /**
     * Mark a notification as read
     */
    async 'notifications.markRead'(notificationId) {
        check(notificationId, String);
        const userId = requireAuth.call(this);

        await Notifications.updateAsync(
            { _id: notificationId, userId },
            { $set: { read: true } }
        );
    },

    /**
     * Mark all as read
     */
    async 'notifications.markAllRead'() {
        const userId = requireAuth.call(this);
        await Notifications.updateAsync(
            { userId, read: false },
            { $set: { read: true } },
            { multi: true }
        );
    },
    
    /**
     * Clear all notifications
     */
    async 'notifications.clear'() {
        const userId = requireAuth.call(this);
        await Notifications.removeAsync({ userId });
    }
});
