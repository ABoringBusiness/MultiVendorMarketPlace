# 🎨 Multi-Vendor Marketplace Backend

This is a **multi-vendor marketplace Backend** built with **Node.js, Express, and Sequelize**. The platform allows **sellers** to upload and manage products, while **buyers** can purchase, review, and rate them. **Admins** have full control over users, products, and orders. The platform also includes an auction system and service billing by the minute.

## 🚀 **Tech Stack**
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Sequelize ORM (Supabase)
- **Authentication:** JWT
- **API Documentation:** Swagger
- **Payment Gateway:** Stripe
- **Containerization:** Docker, Docker Compose
- **Reverse Proxy:** Nginx
- **Caching:** Redis

## 📂 **Project Structure**
```
marketplace-api/
│── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # API controllers
│   ├── middleware/     # Auth and role-based middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API route handlers
│   ├── seeders/        # Database seeders
│   ├── docs/           # Swagger API documentation
│   ├── app.js          # Express app setup
│── .env                # Environment variables
│── README.md           # Documentation
│── package.json        # Node dependencies
│── server.js           # Server entry point
```

## ✅ **Implemented Features**
### 🔐 **Authentication & User Management**
- JWT-based authentication
- User roles: **Buyer, Seller, Admin**
- Admin control over disabling/enabling users

### 🛒 **Seller & Product Management**
- **Sellers** can create, update, and disable their own products
- **Admins** can enable/disable any product
- **Products** belong to **categories**

### 🎨 **Category Management**
- **Admins** can manage categories
- Products are categorized for better filtering

### 🔎 **Product Search & Filtering**
- Filter by **category**
- Filter by **price range**
- Search by **title or description**
- Database column indexing for faster queries

### 🛍️ **Cart & Checkout**
- Add/remove items to cart
- Update item quantities
- Clear cart
- Checkout with Stripe payment integration

### 📦 **Order Management**
- Create orders from cart
- View order history and details
- Sellers can update order status
- Payment status tracking

### 🔨 **Auction System**
- Create auctions with start/end times
- Place bids on auctions
- Automatic auction status updates
- Anti-sniping protection
- Auction history tracking

### 💰 **Penny Auction System**
- Pay-per-bid auction model
- Bid packages for purchasing bids
- Auto-bidding functionality
- Timer extension with each bid
- Detailed bid statistics and history

### 💰 **Service Billing**
- Minute-based billing for platform services
- Track service usage by type
- Generate invoices for service usage
- Payment tracking for service billing
- Usage statistics and reporting

### ⭐ **Reviews & Ratings**
- **Buyers** can add/update/delete reviews for products
- **Admins** can delete any review
- Average ratings are calculated per product

## 🔧 **Installation & Setup**

### 🖥️ **Standard Setup**

#### 1️⃣ Clone the repository
```bash
git clone https://github.com/ABoringBusiness/MultiVendorMarketPlace.git
cd MultiVendorMarketPlace
```

#### 2️⃣ Install dependencies
```bash
npm install
```

#### 3️⃣ Set up environment variables
Create a `.env` file in the project root:
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/marketplace
JWT_SECRET=your_jwt_secret
NODE_ENV=development
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:5000
```

#### 4️⃣ Start the server
```bash
npm start
```
Server will run at http://localhost:5000.

### 🐳 **Docker Setup**

#### 1️⃣ Clone the repository
```bash
git clone https://github.com/ABoringBusiness/MultiVendorMarketPlace.git
cd MultiVendorMarketPlace
```

#### 2️⃣ Set up environment variables
Create a `.env` file in the project root with the same variables as above.

#### 3️⃣ Generate SSL certificates (for development)
```bash
./generate-ssl-certs.sh
```

#### 4️⃣ Start the application with Docker
```bash
./docker-start.sh
```

#### 5️⃣ Stop the application
```bash
./docker-stop.sh
```

With Docker, the application will be available at:
- API: https://localhost/api
- Swagger Docs: https://localhost/api/docs

## 📖 API Documentation
Swagger API documentation is available at:
```
http://localhost:5000/api/docs
```
Or with Docker:
```
https://localhost/api/docs
```

## 🔌 API Endpoints

### 🔍 Search & Filtering
- `GET /api/search` - Search for products
- `GET /api/search?category={id}` - Filter by category
- `GET /api/search?min_price={value}&max_price={value}` - Filter by price range

### 🛒 Cart
- `POST /api/cart` - Add new item to cart
- `GET /api/cart` - Get list of cart items
- `PUT /api/cart` - Update cart item
- `DELETE /api/cart` - Delete cart item

### 📦 Order & Checkout
- `POST /api/orders/create` - Create a new order
- `GET /api/orders/list` - Get list of buyer's orders
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}/update-status` - Update order status (Seller/Admin only)

### 💳 Payments
- `POST /api/payments/checkout` - Initiate Stripe checkout
- `POST /api/payments/webhook` - Handle Stripe webhook responses
- `GET /api/payments/status/{orderId}` - Get payment status

### 🔨 Auctions
- `POST /api/auctions` - Create new auction
- `GET /api/auctions` - List auctions with filters
- `GET /api/auctions/{id}` - Get auction details
- `PUT /api/auctions/{id}` - Update auction
- `DELETE /api/auctions/{id}` - Cancel auction
- `POST /api/auctions/{id}/extend` - Extend auction time

### 💰 Bidding
- `POST /api/bids/{auctionId}` - Place bid
- `GET /api/bids/{auctionId}` - Get all bids for an auction
- `GET /api/bids/user` - Get user bids
- `GET /api/bids/{auctionId}/highest` - Get highest bid

### 💵 Service Billing
- `POST /api/services/start` - Start service usage tracking
- `PUT /api/services/{id}/stop` - Stop service usage tracking
- `GET /api/services/usage` - Get user's service usage history
- `POST /api/services/billing/generate` - Generate billing for service usage
- `GET /api/services/billing` - Get user's billing history
- `GET /api/services/stats` - Get service usage statistics

### 💰 Penny Auctions
- `POST /api/penny-auctions` - Create a new penny auction
- `GET /api/penny-auctions` - Get all penny auctions with filters
- `GET /api/penny-auctions/{id}` - Get penny auction details
- `PUT /api/penny-auctions/{id}` - Update penny auction
- `DELETE /api/penny-auctions/{id}` - Cancel penny auction
- `GET /api/penny-auctions/seller` - Get seller's penny auctions
- `GET /api/penny-auctions/won` - Get won penny auctions
- `GET /api/penny-auctions/bidding` - Get auctions user has bid on
- `GET /api/penny-auctions/stats` - Get penny auction statistics

### 🎯 Penny Bids
- `POST /api/penny-bids/{pennyAuctionId}` - Place a bid on a penny auction
- `GET /api/penny-bids/{pennyAuctionId}` - Get all bids for a penny auction
- `GET /api/penny-bids/user` - Get user's penny bids
- `POST /api/penny-bids/{pennyAuctionId}/auto-bid` - Configure auto-bidding
- `DELETE /api/penny-bids/{pennyAuctionId}/auto-bid` - Stop auto-bidding
- `GET /api/penny-bids/{pennyAuctionId}/stats` - Get bid statistics

### 💳 Bid Packages
- `POST /api/bid-packages` - Create a new bid package (admin)
- `GET /api/bid-packages` - Get all bid packages
- `GET /api/bid-packages/{id}` - Get bid package details
- `PUT /api/bid-packages/{id}` - Update bid package (admin)
- `DELETE /api/bid-packages/{id}` - Delete bid package (admin)
- `POST /api/bid-packages/{id}/purchase` - Purchase a bid package
- `GET /api/bid-packages/balance` - Get user's bid balance
- `GET /api/bid-packages/transactions` - Get user's bid transactions
- `POST /api/bid-packages/add-free-bids` - Add free bids to user (admin)

## 🎯 Next Features
- ✅ Admin Dashboard with Analytics
- ✅ Real-time notifications
- ✅ Multi-language support
- ✅ Enhanced penny auction system with bid packages and auto-bidding
- ✅ Improved search, cart, order, and payment processing

## 🤝 Contributing
1. Fork the repository
2. Create a new branch (`feature-xyz`)
3. Commit changes (`git commit -m 'Add xyz feature'`)
4. Push to the branch (`git push origin feature-xyz`)
5. Open a Pull Request 🚀

## 📜 License
MIT License. Free to use and modify.
