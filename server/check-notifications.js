
const { Notifications } = require('/imports/api/collections/notifications');

async function checkNotifications() {
    try {
        const user = await Meteor.users.findOneAsync({}); // Get first user
        if (!user) throw new Error("No user found");
        const userId = user._id;

        console.log(`Checking Notifications for User ID: ${userId}`);
        const count = await Notifications.find({ userId }).countAsync();
        console.log(`Total Notifications: ${count}`);
        
        const recent = await Notifications.find({ userId }, { sort: { createdAt: -1 }, limit: 5 }).fetchAsync();
        console.log("Recent Notifications:", JSON.stringify(recent, null, 2));

    } catch (e) {
        console.error("Check Failed:", e);
    }
}

checkNotifications();
