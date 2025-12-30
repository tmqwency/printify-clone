import { Meteor } from 'meteor/meteor';

// Publish all users for admin
Meteor.publish('allUsers', function () {
    if (!this.userId) {
        return this.ready();
    }

    const user = Meteor.users.findOne(this.userId);

    // Only admins can see all users
    if (user?.profile?.isAdmin) {
        return Meteor.users.find({}, {
            fields: {
                emails: 1,
                profile: 1,
                createdAt: 1
            }
        });
    }

    return this.ready();
});
