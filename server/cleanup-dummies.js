
(async () => {
    try {
        const { UserProducts } = require('/imports/api/collections/UserProducts');
        const userId = 'q6zPCWsosWD5nmBp7';
        
        const removed = await UserProducts.removeAsync({
            userId,
            name: { $regex: /^Dummy \d+$/ }
        });
        
        console.log(`Removed ${removed} dummy products.`);
        
        // Final sync
        await Meteor.server.method_handlers['subscriptions.syncUsage'].call({ userId });
        console.log("Synced usage.");

    } catch(e) {
        console.error(e);
    }
})();
