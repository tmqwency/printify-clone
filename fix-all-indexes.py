#!/usr/bin/env python3
import re
import os

# Directory containing collection files
collections_dir = '/home/wencxx/printify/imports/api/collections'

# Files to process
files_to_fix = [
    'subscriptions.js',
    'orders.js',
    'mockups.js',
    'product-variants.js',
    'audit-logs.js',
    'order-items.js',
    'webhooks.js',
    'fulfillment-jobs.js',
    'designs.js'
]

print("Removing 'index: true' properties from collection files...")

for filename in files_to_fix:
    filepath = os.path.join(collections_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"Skipping {filename} - file not found")
        continue
    
    print(f"Processing {filename}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove lines with 'index: true' or 'index: true,'
    # Handle both with and without trailing comma
    content = re.sub(r',?\s*index:\s*true,?\s*\n', '\n', content)
    
    # Clean up any double commas that might result
    content = re.sub(r',\s*,', ',', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"  ✓ Fixed {filename}")

print("\nDone! All 'index: true' properties have been removed.")
print("Indexes are properly defined using rawCollection().createIndex()")
