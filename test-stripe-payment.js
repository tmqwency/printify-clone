/**
 * Test script to simulate Stripe payment completion
 * Run this in the browser console after creating a checkout session
 */

// Simulate successful payment by calling the webhook handler directly
async function testStripePayment(storeId, planTier = 'starter') {
  console.log('🧪 Testing Stripe payment flow...');
  
  try {
    // Step 1: Create checkout session
    console.log('Step 1: Creating checkout session...');
    const checkoutResult = await Meteor.callAsync(
      'subscriptions.createCheckoutSession',
      storeId,
      planTier,
      'monthly'
    );
    console.log('✅ Checkout session created:', checkoutResult.sessionId);
    console.log('Checkout URL:', checkoutResult.url);
    
    // Step 2: Simulate subscription creation (normally done by Stripe webhook)
    console.log('\nStep 2: Simulating subscription creation...');
    const subscription = await Meteor.callAsync('subscriptions.get', storeId);
    console.log('Current subscription:', subscription);
    
    // Step 3: Manually update subscription (simulating webhook)
    console.log('\nStep 3: Updating subscription to simulate payment success...');
    await Meteor.callAsync('subscriptions.changePlan', storeId, planTier);
    
    // Step 4: Verify the update
    console.log('\nStep 4: Verifying subscription update...');
    const updatedSubscription = await Meteor.callAsync('subscriptions.get', storeId);
    console.log('✅ Updated subscription:', updatedSubscription);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('Plan tier:', updatedSubscription.planTier);
    console.log('Status:', updatedSubscription.status);
    
    return updatedSubscription;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Helper to get your store ID
async function getMyStoreId() {
  const stores = await Meteor.callAsync('stores.list');
  if (stores && stores.length > 0) {
    console.log('Your store ID:', stores[0]._id);
    return stores[0]._id;
  }
  throw new Error('No stores found');
}

// Run the test
console.log('To test the payment flow, run:');
console.log('1. const storeId = await getMyStoreId();');
console.log('2. await testStripePayment(storeId, "starter");');
console.log('\nOr test different plans: "pro" or "enterprise"');
