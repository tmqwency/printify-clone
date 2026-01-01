import { Meteor } from 'meteor/meteor';
import { Notifications } from '/imports/api/collections/notifications';

Meteor.publish('notifications.mine', function () {
    if (!this.userId) {
        return this.ready();
    }
    
    // Publish user's notifications, limit to recent 50
    return Notifications.find(
        { userId: this.userId },
        { sort: { createdAt: -1 }, limit: 50 }
    );
});
