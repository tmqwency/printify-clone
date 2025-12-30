#!/bin/bash
# Helper script to add Meteor packages

cd /home/wencxx/printify

echo "Adding Meteor packages..."
meteor add accounts-password accounts-google react-meteor-data

echo "Removing insecure packages..."
meteor remove autopublish insecure 2>/dev/null || echo "Packages already removed or not present"

echo "Installing npm dependencies..."
meteor npm install

echo "Done!"
