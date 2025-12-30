# Quick Installation Guide

## Step-by-Step Installation

Run these commands from your WSL terminal:

```bash
# Navigate to project
cd /home/wencxx/printify

# 1. Add Meteor packages
meteor add accounts-password accounts-google react-meteor-data

# 2. Remove insecure packages
meteor remove autopublish insecure

# 3. Install npm dependencies (this includes simpl-schema)
meteor npm install

# 4. Start the server
meteor run --settings settings-development.json
```

## What Gets Installed

### Meteor Packages

- `accounts-password` - Email/password authentication
- `accounts-google` - Google OAuth (optional)
- `react-meteor-data` - React integration for Meteor

### NPM Packages (from package.json)

- `simpl-schema` - Schema validation
- `bcrypt` - Password hashing
- `fabric` - Canvas editor
- `sharp` - Image processing
- `axios` - HTTP client
- `crypto-js` - Encryption utilities
- `react-router-dom` - Routing
- `react-dropzone` - File uploads
- `react-toastify` - Notifications
- `date-fns` - Date utilities
- `lodash` - Utility functions

## Troubleshooting

### If you see "no such package" error

This means you're trying to add an npm package as a Meteor package. Make sure:

- Meteor packages use: `meteor add package-name`
- NPM packages use: `meteor npm install` (reads from package.json)

### If installation fails

```bash
# Clear cache and try again
meteor reset
meteor npm install
```

## Verify Installation

```bash
# Check Meteor packages
meteor list

# Check npm packages
meteor npm list --depth=0
```

You should see:

- Meteor packages: accounts-password, accounts-google, react-meteor-data
- NPM packages: simpl-schema, bcrypt, fabric, sharp, etc.
