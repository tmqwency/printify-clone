
(async () => {
    try {
        const { UserProducts } = require('/imports/api/collections/UserProducts');
        const user = await Meteor.users.findOneAsync({});
        const userId = user._id;

        // Create 3 dummy products
        const ids = [];
        for (let i = 0; i < 3; i++) {
           const id = await UserProducts.insertAsync({
               userId,
               name: `Dummy ${i}`,
               status: 'draft',
               createdAt: new Date()
           });
           ids.push(id);
        }
        console.log("Created dummy products:", ids);

        const result = await Meteor.callAsync('subscriptions.syncUsage');
        console.log("Sync Result:", result);

        // Cleanup
        for (const id of ids) {
            await UserProducts.removeAsync(id);
        }
        console.log("Cleaned up");
        
        // Sync again to reset
        await Meteor.callAsync('subscriptions.syncUsage');

    } catch(e) {
        console.error(e);
    }
})();
