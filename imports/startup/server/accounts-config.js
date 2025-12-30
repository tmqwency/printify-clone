import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { UserRoles } from '../../api/schemas/common';

// Configure account creation
Accounts.config({
    sendVerificationEmail: true,
    forbidClientAccountCreation: false,
    loginExpirationInDays: 30
});

// Email verification settings
Accounts.emailTemplates.siteName = 'Printify Clone';
Accounts.emailTemplates.from = Meteor.settings.private?.email?.from || 'noreply@printify-clone.com';

// Verify Email Template
Accounts.emailTemplates.verifyEmail = {
    subject() {
        return 'Verify your email address';
    },
    text(user, url) {
        return `Hello ${user.profile?.name || 'there'},

Please click the link below to verify your email address:

${url}

If you didn't create an account with Printify Clone, please ignore this email.

Thanks,
The Printify Clone Team`;
    }
};

// Reset Password Template
Accounts.emailTemplates.resetPassword = {
    subject() {
        return 'Reset your password';
    },
    text(user, url) {
        return `Hello ${user.profile?.name || 'there'},

You requested to reset your password. Click the link below to set a new password:

${url}

If you didn't request a password reset, please ignore this email.

Thanks,
The Printify Clone Team`;
    }
};

// Enrollment Email Template
Accounts.emailTemplates.enrollAccount = {
    subject() {
        return 'Welcome to Printify Clone';
    },
    text(user, url) {
        return `Hello ${user.profile?.name || 'there'},

Welcome to Printify Clone! Click the link below to set your password and get started:

${url}

Thanks,
The Printify Clone Team`;
    }
};

// Validate new user creation
Accounts.validateNewUser((user) => {
    // Ensure email is present
    if (!user.emails || user.emails.length === 0) {
        throw new Meteor.Error('invalid-email', 'Email is required');
    }

    // Ensure email is valid
    const email = user.emails[0].address;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Meteor.Error('invalid-email', 'Invalid email format');
    }

    return true;
});

// On user creation
Accounts.onCreateUser((options, user) => {
    // Add default profile
    user.profile = options.profile || {};

    // Set default role
    user.roles = [UserRoles.MERCHANT];

    // Add timestamps
    user.createdAt = new Date();
    user.updatedAt = new Date();

    // Initialize settings
    user.settings = {
        emailNotifications: true,
        orderNotifications: true,
        marketingEmails: false
    };

    return user;
});

// Configure Google OAuth (if credentials provided)
Meteor.startup(async () => {
    if (Meteor.settings.private?.oauth?.google) {
        await ServiceConfiguration.configurations.upsertAsync(
            { service: 'google' },
            {
                $set: {
                    clientId: Meteor.settings.private.oauth.google.clientId,
                    secret: Meteor.settings.private.oauth.google.clientSecret,
                    loginStyle: 'popup'
                }
            }
        );
    }
});


// Rate limiting for login attempts
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

// Limit login attempts
const loginAttemptRule = {
    type: 'method',
    name: 'login',
    connectionId() { return true; }
};

DDPRateLimiter.addRule(loginAttemptRule, 5, 60000); // 5 attempts per minute

// Limit account creation
const createUserRule = {
    type: 'method',
    name: 'createUser',
    connectionId() { return true; }
};

DDPRateLimiter.addRule(createUserRule, 3, 60000); // 3 attempts per minute
