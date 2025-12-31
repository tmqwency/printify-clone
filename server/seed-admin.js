import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.startup(async () => {
    // Check if there are any admin users
    const adminCount = await Meteor.users.find({
        'profile.isAdmin': true
    }).countAsync();

    if (adminCount === 0) {
        console.log('No admin users found. Creating default admin...');

        try {
            // Create default admin user
            const adminUserId = await Accounts.createUserAsync({
                email: 'admin@printify.com',
                password: 'admin123', // Change this in production!
                profile: {
                    isAdmin: true,
                    name: 'Admin User'
                }
            });

            console.log('✅ Default admin user created successfully!');
            console.log('📧 Email: admin@printify.com');
            console.log('🔑 Password: admin123');
            console.log('⚠️  Please change the password after first login!');
            console.log('User ID:', adminUserId);
        } catch (error) {
            console.error('❌ Error creating admin user:', error);
        }
    } else {
        console.log(`✅ Admin users already exist (${adminCount} found). Skipping seed.`);
    }
});
