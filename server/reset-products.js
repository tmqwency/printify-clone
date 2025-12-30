import { Meteor } from 'meteor/meteor';
import { Products } from '../imports/api/collections/products';
import { ProductVariants } from '../imports/api/collections/product-variants';

Meteor.methods({
    async 'admin.resetProducts'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Delete all existing products and variants
        await Products.removeAsync({});
        await ProductVariants.removeAsync({});

        console.log('🗑️  Cleared existing products');

        // Re-create products with correct pixel dimensions
        const tshirtId = await Products.insertAsync({
            name: 'Classic T-Shirt',
            description: '100% cotton, comfortable fit',
            type: 't-shirt',
            imageUrl: '/images/tshirt.png',
            printAreas: [
                { name: 'front', width: 500, height: 600, x: 150, y: 100 },
                { name: 'back', width: 500, height: 600, x: 150, y: 100 }
            ],
            basePrice: 1500,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const hoodieId = await Products.insertAsync({
            name: 'Premium Hoodie',
            description: 'Soft fleece, kangaroo pocket',
            type: 'hoodie',
            imageUrl: '/images/tshirt.png',
            printAreas: [
                { name: 'front', width: 450, height: 550, x: 175, y: 120 },
                { name: 'back', width: 500, height: 600, x: 150, y: 100 }
            ],
            basePrice: 3500,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const mugId = await Products.insertAsync({
            name: 'Ceramic Mug',
            description: '11oz white ceramic mug',
            type: 'mug',
            imageUrl: '/images/mug.png',
            printAreas: [
                { name: 'all-over', width: 350, height: 200, x: 225, y: 150 }
            ],
            basePrice: 1200,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Products recreated with correct dimensions');

        return { success: true, count: 3 };
    }
});
