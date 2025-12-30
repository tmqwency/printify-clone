import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Products } from '../../api/collections/products';
import { ProductVariants } from '../../api/collections/product-variants';
import { PrintProviders } from '../../api/collections/print-providers';

// Seed base products and providers on startup
Meteor.startup(async () => {
    console.log('🌱 Checking for seed data...');

    // Check if we already have products
    const productCount = await Products.find().countAsync();

    if (productCount === 0) {
        console.log('📦 Seeding base products...');

        // Create a mock print provider first
        const providerId = await PrintProviders.insertAsync({
            name: 'Mock Print Provider',
            description: 'Default mock provider for testing',
            supportedProducts: ['t-shirt', 'hoodie', 'mug'],
            shippingMethods: [
                {
                    id: 'standard',
                    name: 'Standard Shipping',
                    description: '5-7 business days',
                    estimatedDays: { min: 5, max: 7 },
                    cost: 500 // $5.00
                },
                {
                    id: 'express',
                    name: 'Express Shipping',
                    description: '2-3 business days',
                    estimatedDays: { min: 2, max: 3 },
                    cost: 1500 // $15.00
                }
            ],
            regionsServed: ['US', 'CA', 'GB'],
            providerType: 'mock',
            status: 'active',
            averageProductionTime: 48,
            successRate: 99.5,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Seed T-Shirt
        const tshirtId = await Products.insertAsync({
            name: 'Classic T-Shirt',
            description: '100% cotton, comfortable fit',
            type: 't-shirt',
            printProviderId: providerId,
            imageUrl: '/images/tshirt.png',
            printAreas: [
                { name: 'front', width: 500, height: 600, x: 150, y: 100 },  // Pixels for canvas
                { name: 'back', width: 500, height: 600, x: 150, y: 100 }
            ],
            dimensions: { width: 28, height: 29 },
            basePrice: 1500, // $15.00
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Seed T-Shirt variants
        const tshirtColors = [
            { color: 'White', hex: '#FFFFFF' },
            { color: 'Black', hex: '#000000' },
            { color: 'Navy', hex: '#000080' },
            { color: 'Red', hex: '#FF0000' }
        ];

        const sizes = ['S', 'M', 'L', 'XL', '2XL'];

        for (const colorObj of tshirtColors) {
            for (const size of sizes) {
                await ProductVariants.insertAsync({
                    productId: tshirtId,
                    size,
                    color: colorObj.color,
                    colorHex: colorObj.hex,
                    sku: `TSHIRT-${colorObj.color.toUpperCase()}-${size}`,
                    priceModifier: size === '2XL' ? 200 : 0,
                    inStock: true,
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Seed Hoodie
        const hoodieId = await Products.insertAsync({
            name: 'Premium Hoodie',
            description: 'Soft fleece, kangaroo pocket',
            type: 'hoodie',
            printProviderId: providerId,
            imageUrl: '/images/hoodie.png',
            printAreas: [
                { name: 'front', width: 450, height: 550, x: 175, y: 120 },  // Pixels for canvas
                { name: 'back', width: 500, height: 600, x: 150, y: 100 }
            ],
            dimensions: { width: 30, height: 32 },
            basePrice: 3500, // $35.00
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Seed Hoodie variants
        for (const colorObj of tshirtColors) {
            for (const size of sizes) {
                await ProductVariants.insertAsync({
                    productId: hoodieId,
                    size,
                    color: colorObj.color,
                    colorHex: colorObj.hex,
                    sku: `HOODIE-${colorObj.color.toUpperCase()}-${size}`,
                    priceModifier: size === '2XL' ? 300 : 0,
                    inStock: true,
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Seed Mug
        const mugId = await Products.insertAsync({
            name: 'Ceramic Mug',
            description: '11oz white ceramic mug',
            type: 'mug',
            printProviderId: providerId,
            imageUrl: '/images/mug.png',
            printAreas: [
                { name: 'all-over', width: 350, height: 200, x: 225, y: 150 }  // Pixels for canvas
            ],
            dimensions: { width: 3.2, height: 3.7 },
            basePrice: 1200, // $12.00
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Seed Mug variant (one size)
        await ProductVariants.insertAsync({
            productId: mugId,
            size: 'One Size',
            color: 'White',
            colorHex: '#FFFFFF',
            sku: 'MUG-WHITE-11OZ',
            priceModifier: 0,
            inStock: true,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ Seed data created successfully!');
        console.log(`   - 1 Print Provider`);
        console.log(`   - 3 Base Products`);
        console.log(`   - ${(tshirtColors.length * sizes.length * 2) + 1} Product Variants`);
    } else {
        console.log('✅ Seed data already exists, skipping...');
    }

    // Create admin user if it doesn't exist
    const adminEmail = 'admin@printify.com';
    const existingAdmin = await Meteor.users.findOneAsync({ 'emails.address': adminEmail });

    if (!existingAdmin) {
        console.log('👤 Creating admin user...');
        const adminUserId = await Accounts.createUserAsync({
            email: adminEmail,
            password: 'admin123',
            profile: {
                name: 'Admin User',
                isAdmin: true
            }
        });
        console.log('✅ Admin user created!');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: admin123`);
    } else {
        console.log('✅ Admin user already exists');
    }
});
