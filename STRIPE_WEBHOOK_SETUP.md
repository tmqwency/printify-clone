# Stripe Webhook Setup for Local Development

## The Problem

When you complete a Stripe payment, your subscription plan doesn't update because Stripe webhooks can't reach your localhost server.

## Solution: Use Stripe CLI

### Step 1: Install Stripe CLI

**On macOS (if you have Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

**Without Homebrew:**
Download from: https://github.com/stripe/stripe-cli/releases/latest

### Step 2: Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate.

### Step 3: Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 4: Update Webhook Secret

Copy the webhook signing secret (starts with `whsec_`) and update it in:
`settings-development.json` → `private.stripe.webhookSecret`

### Step 5: Test the Payment Flow

1. Keep the `stripe listen` command running in a terminal
2. Go to your app and upgrade to a paid plan
3. Complete the Stripe checkout
4. Watch the terminal - you'll see webhook events coming in!
5. Your subscription will automatically update

## Alternative: Manual Testing (Without Stripe CLI)

If you can't install Stripe CLI, you can manually trigger the subscription update:

### In Browser Console:

```javascript
// Get your store ID
const stores = await Meteor.callAsync("stores.list");
const storeId = stores[0]._id;

// Manually update to a paid plan
await Meteor.callAsync("subscriptions.changePlan", storeId, "starter");

// Verify the update
const subscription = await Meteor.callAsync("subscriptions.get", storeId);
console.log("Updated plan:", subscription.planTier);
```

## Webhook Events You Should See

When payment completes successfully, you'll see these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `invoice.payment_succeeded`

Each event will update your local database with the new subscription details.

## Troubleshooting

**Webhooks not coming through?**

- Make sure `stripe listen` is running
- Check that the webhook secret in `settings-development.json` matches the one from `stripe listen`
- Restart your Meteor server after updating the webhook secret

**Still showing "free" plan?**

- Check the browser console for errors
- Check the Meteor server logs for webhook processing errors
- Use the manual testing method above to verify the subscription update works
