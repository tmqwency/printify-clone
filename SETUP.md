# Printify Clone - Setup Instructions

## For Windows Users with WSL

If you're running this project from WSL on Windows, you may encounter UNC path issues with Meteor commands. Here's how to work around them:

### Option 1: Run Commands from WSL Terminal

1. Open WSL terminal (Ubuntu)
2. Navigate to project directory:

   ```bash
   cd /home/wencxx/printify
   ```

3. Run Meteor commands:

   ```bash
   # Add Meteor packages
   meteor add accounts-password accounts-google react-meteor-data

   # Remove insecure packages
   meteor remove autopublish insecure

   # Install npm dependencies (includes simpl-schema)
   meteor npm install
   ```

4. Start the server:
   ```bash
   meteor run --settings settings-development.json
   ```

### Option 2: Use the Setup Script

We've provided a bash script that handles package installation:

```bash
# From WSL terminal
cd /home/wencxx/printify
bash setup-packages.sh
```

### Option 3: Manual Package Installation

If the above methods don't work, you can install packages manually:

1. Install Meteor packages:

   ```bash
   cd /home/wencxx/printify
   meteor add accounts-password
   meteor add accounts-google
   meteor add react-meteor-data
   ```

2. Remove insecure packages:

   ```bash
   meteor remove autopublish
   meteor remove insecure
   ```

3. Install npm dependencies (includes simpl-schema):
   ```bash
   meteor npm install
   ```

## Verifying Installation

After installation, verify everything is set up correctly:

```bash
# Check Meteor version
meteor --version

# List installed packages
meteor list

# Check npm packages
meteor npm list --depth=0
```

## Running the Application

```bash
# Development mode with settings
meteor run --settings settings-development.json

# Or use npm script
npm run dev
```

The application will be available at http://localhost:3000

## Troubleshooting

### "Cannot find module" errors

If you see module not found errors, try:

```bash
meteor npm install
meteor reset
meteor run --settings settings-development.json
```

### Port already in use

If port 3000 is already in use:

```bash
meteor run --settings settings-development.json --port 3001
```

### MongoDB connection issues

Meteor includes MongoDB, but if you have issues:

```bash
meteor reset  # This will clear the database
```

## Next Steps

After successful installation:

1. Create an admin user account
2. Explore the collections in MongoDB
3. Test authentication methods
4. Create a test store
5. Continue with Phase 4 implementation (Product Customization Engine)
