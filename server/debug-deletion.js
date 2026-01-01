
const { UserProducts } = require('/imports/api/collections/UserProducts');

async function testProductDeletion() {
    try {
        const user = await Meteor.users.findOneAsync({}); // Get first user
        if (!user) throw new Error("No user found");
        const userId = user._id;

        console.log(`Testing Deletion for User ID: ${userId}`);

        // 1. Create a dummy product
        const id = await Meteor.callAsync('userProducts.create', {
            name: "Delete Me",
            description: "Test deletion",
            baseProductId: "base-1", // Assuming this exists or validation is skipped if base not found in test env? 
            // Wait, create checks baseProduct. We need a valid baseProductId or mock it.
            // Let's manually insert a product first to bypass create validation if needed, 
            // OR just try to delete an existing one if available.
            
            // Better: Manual insert to avoid dependencies, then call delete method.
            designData: {},
            previewImages: {},
            price: 1000
        }); 
        // Oops, 'userProducts.create' might fail if baseProductId doesn't exist.
        
        // Let's manually insert a product into DB acting as if it was created
        const productId = await UserProducts.insertAsync({
             userId,
             name: "Manual Test Product",
             storageSize: 1024 * 1024, // 1MB
             createdAt: new Date(),
             status: 'draft'
        });
        
        console.log(`Created manual product: ${productId}`);

        // 2. Delete it using the method
        // We need to simulate method call context or just invoke the method logic
        // Meteor.callAsync handles context if we are client, but here we are server shell.
        // We can use `Meteor.server.method_handlers['userProducts.delete']` but need to set `this.userId`.
        
        await new Promise((resolve, reject) => {
            const context = { userId };
            Meteor.server.method_handlers['userProducts.delete'].apply(context, [productId])
                .then(resolve)
                .catch(reject);
        });

        console.log("Deletion successful!");

        // 3. Verify gone
        const found = await UserProducts.findOneAsync(productId);
        if (!found) {
            console.log("Verified: Product is gone.");
        } else {
            console.error("Error: Product still exists!");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testProductDeletion();
