
const { Designs } = require('/imports/api/collections/designs');
const { Subscriptions } = require('/imports/api/collections/subscriptions');

async function testStorageTracking() {
    try {
        const user = await Meteor.users.findOneAsync({}); // Get first user (admin/test user)
        if (!user) throw new Error("No user found");
        const userId = user._id;

        console.log(`Testing with User ID: ${userId}`);

        // Get initial subscription
        let sub = await Subscriptions.findOneAsync({ userId });
        const initialStorage = sub?.usage?.storageUsedMB || 0;
        console.log(`Initial Storage: ${initialStorage} MB`);

        // Simulate Upload
        const fileSize = 5 * 1024 * 1024; // 5 MB
        const designId = await Meteor.callAsync('designs.upload', {
            name: "Test Design",
            fileUrl: "http://example.com/test.png",
            fileType: "image/png",
            fileSize: fileSize
        });

        console.log(`Uploaded Design ID: ${designId}`);

        // Check subscription again
        sub = await Subscriptions.findOneAsync({ userId });
        const newStorage = sub?.usage?.storageUsedMB || 0;
        console.log(`New Storage: ${newStorage} MB`);

        if (newStorage > initialStorage) {
            console.log("SUCCESS: Storage usage incremented.");
        } else {
            console.log("FAILURE: Storage usage did NOT increment.");
        }

        // Cleanup
        await Meteor.callAsync('designs.delete', designId);
        
        // Final check
        sub = await Subscriptions.findOneAsync({ userId });
        console.log(`Final Storage after cleanup: ${sub?.usage?.storageUsedMB} MB`);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testStorageTracking();
