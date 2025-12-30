#!/bin/bash
# Script to remove all attachSchema calls from collection files

cd /home/wencxx/printify/imports/api/collections

echo "Removing attachSchema calls from collection files..."

# Remove attachSchema from all collection files
for file in *.js; do
    if [ "$file" != "index.js" ]; then
        echo "Processing $file..."
        # Remove the attachSchema line
        sed -i '/\.attachSchema(/d' "$file"
    fi
done

echo "Done! All attachSchema calls have been removed."
echo "Schema validation will be performed in Meteor methods instead."
