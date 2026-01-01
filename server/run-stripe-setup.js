
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
  if (Meteor.isServer) {
    console.log('Running Stripe setup...');
    try {
      const result = await Meteor.callAsync('admin.createStripeProducts');
      console.log('Stripe setup result:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('Stripe setup failed:', e);
    }
  }
});
