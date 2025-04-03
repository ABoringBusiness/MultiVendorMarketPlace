# Setting Up the Admin Panel APIs

This guide provides step-by-step instructions for setting up and using the seller and buyer admin panel APIs.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Redis (for Socket.IO session store)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ABoringBusiness/MultiVendorMarketPlace.git
   cd MultiVendorMarketPlace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
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

4. Set up the database:
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. Start the server with admin panel support:
   ```bash
   node src/app-with-admin.js
   ```

## Authentication

All admin panel APIs require authentication using JWT tokens. To authenticate:

1. Login using the `/api/auth/login` endpoint to get a JWT token
2. Include the token in the Authorization header for all requests:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

## Role-Based Access

The admin panel APIs use role-based access control:
- Seller admin endpoints require the user to have the 'seller' role
- Buyer admin endpoints require the user to have the 'buyer' role

## Testing with Swagger

The API documentation is available at `/api/docs`. To test the APIs:

1. Start the server
2. Navigate to `http://localhost:5000/api/docs` in your browser
3. Authenticate by clicking the "Authorize" button and entering your JWT token
4. Test the endpoints using the Swagger UI

## Testing with Postman

1. Import the Postman collection from `docs/postman/admin-panel-apis.json`
2. Set up an environment variable for your JWT token
3. Test the endpoints using Postman