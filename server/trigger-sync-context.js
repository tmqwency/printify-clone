
(async () => {
    try {
        const { UserProducts } = require('/imports/api/collections/UserProducts');
        const fs = require('fs');
        const log = (msg) => fs.appendFileSync('/tmp/debug_notification.log', 'SCRIPT: ' + msg + '\n');
        
        const userId = 'q6zPCWsosWD5nmBp7'; // From logs

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
        log("Created dummy products: " + JSON.stringify(ids));
        
        // Inspect one
        const inserted = await UserProducts.findOneAsync(ids[0]);
        log("Inserted doc: " + JSON.stringify(inserted));

        const count = await UserProducts.find({ userId }).countAsync();
        log(`Verified count for user ${userId}: ${count}`);
        
        // Check raw find
        const all = await UserProducts.find({ userId }).fetchAsync();
        log(`All products: ${all.map(p => p._id + ':' + p.status).join(', ')}`);

        // Invoke method handler directly with context
        const result = await Meteor.server.method_handlers['subscriptions.syncUsage'].apply({ userId }, []);
        console.log("Sync Result:", JSON.stringify(result));

        // Cleanup
        for (const id of ids) {
            await UserProducts.removeAsync(id);
        }
        console.log("Cleaned up");
        
        // Sync again to reset
        await Meteor.server.method_handlers['subscriptions.syncUsage'].apply({ userId }, []);

    } catch(e) {
        console.error("Script Error:", e);
    }
})();
