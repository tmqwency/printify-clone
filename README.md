# Printify Clone - MeteorJS

A complete print-on-demand SaaS platform built with MeteorJS that connects merchants to print providers and external storefronts (Shopify, Etsy). This is NOT an e-commerce store—it's a backend platform for managing print-on-demand operations.

## 🎯 Features

- **Authentication & Authorization**

  - Email/password authentication with Meteor Accounts
  - Google OAuth integration (configurable)
  - Role-based access control (Merchant, Admin)
  - API token generation for external integrations
  - Email verification and password reset

- **Store Management**

  - Connect multiple storefronts per merchant
  - Support for Shopify and Etsy (with mock adapters)
  - Secure OAuth token storage
  - API key management

- **Product Customization Engine**

  - Base product catalog (t-shirts, hoodies, mugs, etc.)
  - Product variant system (size, color, material)
  - Design upload and management (PNG/SVG)
  - Canvas-based design editor (fabric.js)
  - Mockup generation system
  - DPI and bleed validation

- **Print Provider System**

  - Pluggable provider adapter architecture
  - Mock print providers included
  - Product and variant mapping
  - Pricing rules engine
  - Shipping method configuration

- **Order & Fulfillment**

  - Order ingestion from storefronts
  - Automated provider assignment
  - Fulfillment job queue with retry logic
  - Order lifecycle tracking
  - Status updates back to storefronts

- **Billing & Subscriptions**

  - Stripe integration (simulation mode)
  - Multiple subscription tiers (Free, Starter, Pro, Enterprise)
  - Usage tracking and limits enforcement
  - Webhook handling for billing events

- **Webhooks & APIs**
  - REST API with authentication
  - Rate limiting
  - Outgoing webhook system with retry logic
  - HMAC signature verification

## 🏗️ Architecture

```
printify/
├── imports/
│   ├── api/
│   │   ├── collections/      # MongoDB collections with schemas
│   │   ├── methods/          # Meteor methods (server-side)
│   │   ├── publications/     # Data publications
│   │   ├── schemas/          # Shared schema definitions
│   │   └── users/            # User helpers
│   ├── startup/
│   │   ├── server/           # Server initialization
│   │   └── client/           # Client initialization
│   ├── ui/                   # React components
│   └── lib/                  # Shared utilities
├── server/                   # Server entry point
├── client/                   # Client entry point
├── public/                   # Static assets
└── tests/                    # Test files
```

## 📦 Tech Stack

- **Framework**: MeteorJS 3.x
- **Frontend**: React 18
- **Database**: MongoDB
- **Authentication**: Meteor Accounts
- **Schema Validation**: simpl-schema
- **Image Processing**: sharp
- **Canvas Editor**: fabric.js
- **Payments**: Stripe (simulation)
- **Storage**: Local filesystem (S3-compatible ready)

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ and npm
- Meteor 3.x
- MongoDB (included with Meteor)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd printify
   ```

2. **Install Meteor packages**

   ```bash
   # From within WSL if on Windows
   cd /home/wencxx/printify
   bash setup-packages.sh
   ```

   Or manually:

   ```bash
   meteor add accounts-password accounts-google simpl-schema react-meteor-data
   meteor remove autopublish insecure
   meteor npm install
   ```

3. **Configure settings**

   - Review `settings-development.json`
   - Update mock credentials if needed (or add real ones later)

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Or:

   ```bash
   meteor run --settings settings-development.json
   ```

5. **Access the application**
   - Open http://localhost:3000
   - Create an account to get started

## 📚 Collections

### Core Collections

- **Users** - Extended Meteor.users with roles and settings
- **Stores** - Connected storefronts with OAuth tokens
- **Products** - Base product catalog
- **ProductVariants** - Product variations (size, color, etc.)
- **Designs** - User-uploaded designs with canvas state
- **Mockups** - Generated product mockups
- **PrintProviders** - Print provider catalog and configuration
- **Orders** - Orders from connected storefronts
- **OrderItems** - Individual line items in orders
- **FulfillmentJobs** - Fulfillment queue with retry logic
- **Subscriptions** - Billing subscriptions and usage tracking
- **Webhooks** - Outgoing webhook subscriptions
- **AuditLogs** - System audit trail

## 🔐 Authentication

### User Registration

```javascript
Accounts.createUser({
  email: "merchant@example.com",
  password: "securepassword",
  profile: {
    name: "John Doe",
    company: "My Company",
  },
});
```

### API Token Generation

```javascript
Meteor.call("auth.generateApiToken", storeId, (error, result) => {
  if (!error) {
    console.log("API Key:", result.apiKey);
    console.log("API Secret:", result.apiSecret);
  }
});
```

## 🏪 Store Management

### Create a Store

```javascript
Meteor.call(
  "stores.create",
  {
    name: "My Shopify Store",
    description: "My awesome print-on-demand store",
    platform: "shopify",
  },
  (error, storeId) => {
    if (!error) {
      console.log("Store created:", storeId);
    }
  }
);
```

## 🎨 Product Customization

### Upload a Design

```javascript
// Upload file to server
// Save design with canvas state
Meteor.call("designs.create", {
  storeId: "xxx",
  name: "My Design",
  fileType: "png",
  originalFileUrl: "https://...",
  canvasState: {
    /* fabric.js JSON */
  },
});
```

## 🔌 API Usage

### Authentication

All API requests require an API key in the header:

```bash
curl -H "X-API-Key: pk_xxxxx" \
     -H "X-API-Secret: sk_xxxxx" \
     https://your-domain.com/api/v1/products
```

### Rate Limits

- 100 requests per minute per store
- Configurable in settings

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:collections
npm run test:methods
npm run test:integrations
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
npm run docker:build
```

### Run with Docker Compose

```bash
npm run docker:run
```

## 📝 Configuration

### Environment Variables

Set these in `settings-development.json` or `settings-production.json`:

- **OAuth Credentials**: Google, Shopify
- **Stripe Keys**: For billing integration
- **Storage**: S3 configuration
- **Email**: SMTP settings
- **API**: Rate limiting configuration

### Subscription Tiers

| Tier       | Orders/Month | Products  | API Calls | Storage   |
| ---------- | ------------ | --------- | --------- | --------- |
| Free       | 10           | 5         | 1,000     | 100MB     |
| Starter    | 100          | 50        | 10,000    | 1GB       |
| Pro        | 1,000        | 500       | 100,000   | 10GB      |
| Enterprise | Unlimited    | Unlimited | Unlimited | Unlimited |

## 🔧 Development

### Project Structure

- **Collections**: Define in `imports/api/collections/`
- **Methods**: Add to `imports/api/methods/`
- **Publications**: Create in `imports/api/publications/`
- **UI Components**: Build in `imports/ui/components/`
- **Pages**: Add to `imports/ui/pages/`

### Adding a New Collection

1. Create schema in `imports/api/collections/your-collection.js`
2. Export from `imports/api/collections/index.js`
3. Import in `server/main.js`

### Adding a New Method

1. Create in `imports/api/methods/your-methods.js`
2. Import in `server/main.js`
3. Use `requireAuth()` and `check()` for validation

## 🚦 Roadmap

- [x] Phase 1: Project setup and MongoDB schemas
- [x] Phase 2: Authentication system
- [x] Phase 3: Core data models
- [ ] Phase 4: Product customization engine
- [ ] Phase 5: Print provider system
- [ ] Phase 6: Shopify integration
- [ ] Phase 7: Order fulfillment pipeline
- [ ] Phase 8: Billing and subscriptions
- [ ] Phase 9: Dashboards (merchant and admin)
- [ ] Phase 10: REST API and webhooks
- [ ] Phase 11: Docker deployment

## 📄 License

MIT

## 🤝 Contributing

This is a learning/demonstration project. Feel free to fork and modify!

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Note**: This project uses MOCK integrations for all third-party services (Shopify, Stripe, Google OAuth) by default. Real credentials can be added in the settings file when ready for production use.
