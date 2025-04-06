# Backend Setup Guide for MultiVendorMarketPlace

This guide provides step-by-step instructions for setting up and configuring the backend to support the following use cases:
- Services paid for by the minute
- Digital products for purchase or auction
- Custom clothing design with commission-based reselling
- Affiliate payments for resellers
- Bookable service products (home inspections, minute-based services)

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/ABoringBusiness/MultiVendorMarketPlace.git
cd MultiVendorMarketPlace

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file with the following variables:

```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/marketplace
JWT_SECRET=your_jwt_secret
NODE_ENV=development
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
SOCKET_PORT=5001
```

### 3. Database Setup

```bash
# Create database tables
npx sequelize-cli db:migrate

# Seed initial data (admin user, categories, etc.)
npx sequelize-cli db:seed:all
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Docker Setup (Alternative)

```bash
# Build and start containers
docker-compose up -d

# Stop containers
docker-compose down
```

## Testing the API

The API documentation is available at:
```
http://localhost:5000/api/docs
```

You can use tools like Postman or curl to test the endpoints.

## User Accounts for Testing

After running the seeders, the following test accounts will be available:

1. Admin User:
   - Email: admin@example.com
   - Password: password123

2. Seller User:
   - Email: seller@example.com
   - Password: password123

3. Buyer User:
   - Email: buyer@example.com
   - Password: password123

4. Service Provider:
   - Email: provider@example.com
   - Password: password123

5. Affiliate:
   - Email: affiliate@example.com
   - Password: password123