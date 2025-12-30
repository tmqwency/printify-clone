#!/bin/bash
# Script to fix all SimpleSchema.RegEx references in collection files

cd /home/wencxx/printify/imports/api/collections

echo "Fixing RegEx patterns in collection files..."

# Fix products.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' products.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" products.js

# Fix product-variants.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' product-variants.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' product-variants.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" product-variants.js

# Fix designs.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' designs.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' designs.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" designs.js

# Fix mockups.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' mockups.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' mockups.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" mockups.js

# Fix orders.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' orders.js
sed -i 's/SimpleSchema\.RegEx\.Email/RegExPatterns.Email/g' orders.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' orders.js
sed -i "s/import { TimestampSchema, createEnumValidator, OrderStatus, AddressSchema } from/import { TimestampSchema, createEnumValidator, OrderStatus, AddressSchema, RegExPatterns } from/g" orders.js

# Fix order-items.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' order-items.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' order-items.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" order-items.js

# Fix print-providers.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' print-providers.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" print-providers.js

# Fix fulfillment-jobs.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' fulfillment-jobs.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' fulfillment-jobs.js
sed -i "s/import { TimestampSchema, createEnumValidator, FulfillmentStatus } from/import { TimestampSchema, createEnumValidator, FulfillmentStatus, RegExPatterns } from/g" fulfillment-jobs.js

# Fix subscriptions.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' subscriptions.js
sed -i "s/import { TimestampSchema, createEnumValidator, SubscriptionStatus } from/import { TimestampSchema, createEnumValidator, SubscriptionStatus, RegExPatterns } from/g" subscriptions.js

# Fix webhooks.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' webhooks.js
sed -i 's/SimpleSchema\.RegEx\.Url/RegExPatterns.Url/g' webhooks.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" webhooks.js

# Fix audit-logs.js
sed -i 's/SimpleSchema\.RegEx\.Id/RegExPatterns.Id/g' audit-logs.js
sed -i "s/import { TimestampSchema } from/import { TimestampSchema, RegExPatterns } from/g" audit-logs.js

echo "Done! All RegEx patterns have been fixed."
