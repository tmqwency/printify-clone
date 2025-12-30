#!/bin/bash
# Script to remove all 'index: true' properties from schema definitions

cd /home/wencxx/printify/imports/api/collections

echo "Removing 'index: true' properties from schema definitions..."

# Remove index properties from all collection files
for file in *.js; do
    if [ "$file" != "index.js" ]; then
        echo "Processing $file..."
        # Remove lines with 'index: true' or 'index: 1'
        sed -i '/index: true,\?$/d' "$file"
        sed -i '/index: 1,\?$/d' "$file"
    fi
done

echo "Done! All 'index' properties have been removed from schemas."
echo "Indexes are created separately using rawCollection().createIndex()"
