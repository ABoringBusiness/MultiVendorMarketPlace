# 🎨 Multi-Vendor Marketplace Backend

This is a **multi-vendor marketplace Backend** built with **Node.js, Express, and Sequelize**. The platform allows **sellers** to upload and manage digital artwork (paintings), while **buyers** can purchase, review, and rate them. **Admins** have full control over users, products, and orders.

## 🚀 **Tech Stack**
- **Backend:** Node.js, Express.js
- **Database:** MySQL with Sequelize ORM
- **Authentication:** Supabase (JWT-based)
- **API Documentation:** Swagger
- **Payment Gateway:** Stripe (planned)
- **Deployment:** AWS (planned)

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
- Supabase JWT-based authentication
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

### ⭐ **Reviews & Ratings**
- **Buyers** can add/update/delete reviews for products
- **Admins** can delete any review
- Average ratings are calculated per product

## 🔧 **Installation & Setup**
### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/marketplace-api.git
cd marketplace-api
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Set up environment variables
Create a `.env` file in the project root:
```
DATABASE_URL=mysql://root:@127.0.0.1:3306/marketplace
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 4️⃣ Run database migrations & seeders
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5️⃣ Start the server
```bash
node server.js
```
Server will run at http://localhost:5000.

## 📖 API Documentation
Swagger API documentation is available at:
```
http://localhost:5000/api/docs
```

## 🎯 Next Features
- ✅ Order & Checkout (Stripe Integration)
- ✅ Admin Dashboard with Analytics (Planned)

## 🤝 Contributing
1. Fork the repository
2. Create a new branch (`feature-xyz`)
3. Commit changes (`git commit -m 'Add xyz feature'`)
4. Push to the branch (`git push origin feature-xyz`)
5. Open a Pull Request 🚀

## 📜 License
MIT License. Free to use and modify.
