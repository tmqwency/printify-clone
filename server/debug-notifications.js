
const { Notifications } = require('/imports/api/collections/notifications');

async function testNotifications() {
    try {
        const user = await Meteor.users.findOneAsync({}); // Get first user
        if (!user) throw new Error("No user found");
        const userId = user._id;

        console.log(`Testing Notifications for User ID: ${userId}`);

        // 1. Create Order Notification
        await Notifications.insertAsync({
            userId,
            type: 'order_created',
            title: 'Test Order #1234',
            message: 'This is a test notification for a new order.',
            data: { orderId: 'test-id', externalOrderId: '1234' },
            read: false,
            createdAt: new Date()
        });
        console.log("Created 'order_created' notification.");

        // 2. Create Usage Warning Notification
        await Notifications.insertAsync({
            userId,
            type: 'usage_limit_warning',
            title: 'Test Usage Alert',
            message: 'This is a test notification for usage limits.',
            data: { metric: 'orders', current: 75, max: 100 },
            read: false,
            createdAt: new Date()
        });
        console.log("Created 'usage_limit_warning' notification.");

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testNotifications();
