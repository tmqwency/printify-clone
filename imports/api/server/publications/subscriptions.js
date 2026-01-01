import { Meteor } from 'meteor/meteor';
import { Subscriptions } from '../../collections/subscriptions';

Meteor.publish('subscriptions.mine', function () {
    if (!this.userId) {
        return this.ready();
    }

    return Subscriptions.find({ userId: this.userId });
});
