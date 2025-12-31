#!/bin/bash

# Script to create Stripe products and prices for the Printify clone
# Make sure you have Stripe CLI installed and logged in: stripe login

echo "Creating Stripe products and prices..."

# Create Starter Plan
echo "Creating Starter plan..."
STARTER_PRODUCT=$(stripe products create \
  --name="Starter Plan" \
  --description="100 orders/month, 50 products, 10K API calls" \
  --format=json)

STARTER_PRODUCT_ID=$(echo $STARTER_PRODUCT | grep -o '"id": "[^"]*' | grep -o '[^"]*$')

STARTER_MONTHLY=$(stripe prices create \
  --product=$STARTER_PRODUCT_ID \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month \
  --format=json)

STARTER_MONTHLY_PRICE=$(echo $STARTER_MONTHLY | grep -o '"id": "[^"]*' | grep -o '[^"]*$')

echo "Starter Monthly Price ID: $STARTER_MONTHLY_PRICE"

# Create Pro Plan
echo "Creating Pro plan..."
PRO_PRODUCT=$(stripe products create \
  --name="Pro Plan" \
  --description="1K orders/month, 500 products, 100K API calls" \
  --format=json)

PRO_PRODUCT_ID=$(echo $PRO_PRODUCT | grep -o '"id": "[^"]*' | grep -o '[^"]*$')

PRO_MONTHLY=$(stripe prices create \
  --product=$PRO_PRODUCT_ID \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=month \
  --format=json)

PRO_MONTHLY_PRICE=$(echo $PRO_MONTHLY | grep -o '"id": "[^"]*' | grep -o '[^"]*$')

echo "Pro Monthly Price ID: $PRO_MONTHLY_PRICE"

# Create Enterprise Plan
echo "Creating Enterprise plan..."
ENTERPRISE_PRODUCT=$(stripe products create \
  --name="Enterprise Plan" \
  --description="Unlimited everything" \
  --format=json)

ENTERPRISE_PRODUCT_ID=$(echo $ENTERPRISE_PRODUCT | grep -o '"id": "[^"]*' | grep -o '[^"]*$')

ENTERPRISE_MONTHLY=$(stripe prices create \
  --product=$ENTERPRISE_PRODUCT_ID \
  --unit-amount=29900 \
  --currency=usd \
  --recurring[interval]=month \
  --format=json)

ENTERPRISE_MONTHLY_PRICE=$(echo $ENTERPRISE_MONTHLY | grep -o '"id": "[^"]*' | grep -o '[^"]*$')

echo "Enterprise Monthly Price ID: $ENTERPRISE_MONTHLY_PRICE"

echo ""
echo "✅ All products and prices created!"
echo ""
echo "Update your stripe-service.js with these Price IDs:"
echo ""
echo "export const STRIPE_PRICE_IDS = {"
echo "    starter: {"
echo "        monthly: '$STARTER_MONTHLY_PRICE',"
echo "        yearly: 'price_starter_yearly' // Create this manually if needed"
echo "    },"
echo "    pro: {"
echo "        monthly: '$PRO_MONTHLY_PRICE',"
echo "        yearly: 'price_pro_yearly'"
echo "    },"
echo "    enterprise: {"
echo "        monthly: '$ENTERPRISE_MONTHLY_PRICE',"
echo "        yearly: 'price_enterprise_yearly'"
echo "    }"
echo "};"
