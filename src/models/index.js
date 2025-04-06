const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");

// Define ServiceUsage model for billing by the minute
const ServiceUsage = sequelize.define("ServiceUsage", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: false,
    // Types: 'auction', 'marketplace', 'premium_listing', 'featured_product', etc.
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ratePerMinute: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active', // active, completed, billed
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
      name: 'service_usage_user_idx'
    },
    {
      fields: ['serviceType'],
      name: 'service_usage_type_idx'
    },
    {
      fields: ['status'],
      name: 'service_usage_status_idx'
    },
    {
      fields: ['startTime', 'endTime'],
      name: 'service_usage_time_idx'
    }
  ]
});

// Define ServiceBilling model for invoices
const ServiceBilling = sequelize.define("ServiceBilling", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  billingPeriodStart: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  billingPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // pending, paid, overdue, cancelled
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
      name: 'service_billing_user_idx'
    },
    {
      fields: ['status'],
      name: 'service_billing_status_idx'
    },
    {
      fields: ['invoiceNumber'],
      name: 'service_billing_invoice_idx'
    },
    {
      fields: ['billingPeriodStart', 'billingPeriodEnd'],
      name: 'service_billing_period_idx'
    }
  ]
});

// Define Cart model
const Cart = sequelize.define("Cart", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
}, {
  timestamps: true,
});

// Define CartItem model
const CartItem = sequelize.define("CartItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cartId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Carts",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Products",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: true,
});

// Define Order model
const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "unpaid",
  },
  stripeSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

// Define OrderItem model
const OrderItem = sequelize.define("OrderItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Orders",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Products",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

// Define Auction model
const Auction = sequelize.define("Auction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Categories",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startingBid: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currentBid: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  highestBidderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Users",
      key: "id",
    },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending", // pending, active, completed, cancelled
  },
  isDisabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['categoryId'],
      name: 'auction_category_idx'
    },
    {
      fields: ['sellerId'],
      name: 'auction_seller_idx'
    },
    {
      fields: ['startTime', 'endTime'],
      name: 'auction_time_idx'
    },
    {
      fields: ['status'],
      name: 'auction_status_idx'
    }
  ]
});

// Define Bid model
const Bid = sequelize.define("Bid", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  auctionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Auctions",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  bidderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['auctionId'],
      name: 'bid_auction_idx'
    },
    {
      fields: ['bidderId'],
      name: 'bid_bidder_idx'
    }
  ]
});

// Define associations
User.hasMany(Cart, { foreignKey: "userId", onDelete: "CASCADE" });
Cart.belongsTo(User, { foreignKey: "userId" });

Cart.hasMany(CartItem, { foreignKey: "cartId", onDelete: "CASCADE", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId" });

Product.hasMany(CartItem, { foreignKey: "productId", onDelete: "CASCADE" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Product.hasMany(OrderItem, { foreignKey: "productId", onDelete: "CASCADE" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Auction associations
User.hasMany(Auction, { foreignKey: "sellerId", as: "auctions" });
Auction.belongsTo(User, { foreignKey: "sellerId", as: "seller" });

User.hasMany(Auction, { foreignKey: "highestBidderId", as: "wonAuctions" });
Auction.belongsTo(User, { foreignKey: "highestBidderId", as: "highestBidder" });

Category.hasMany(Auction, { foreignKey: "categoryId" });
Auction.belongsTo(Category, { foreignKey: "categoryId" });

// Bid associations
User.hasMany(Bid, { foreignKey: "bidderId", as: "bids" });
Bid.belongsTo(User, { foreignKey: "bidderId", as: "bidder" });

Auction.hasMany(Bid, { foreignKey: "auctionId", as: "bids" });
Bid.belongsTo(Auction, { foreignKey: "auctionId", as: "auction" });

// Service usage and billing associations
User.hasMany(ServiceUsage, { foreignKey: "userId", as: "serviceUsages" });
ServiceUsage.belongsTo(User, { foreignKey: "userId" });

User.hasMany(ServiceBilling, { foreignKey: "userId", as: "serviceBillings" });
ServiceBilling.belongsTo(User, { foreignKey: "userId" });

// Many-to-many relationship between ServiceBilling and ServiceUsage
const ServiceBillingItem = sequelize.define('ServiceBillingItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serviceBillingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "ServiceBillings",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  serviceUsageId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "ServiceUsages",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['serviceBillingId'],
      name: 'billing_item_billing_idx'
    },
    {
      fields: ['serviceUsageId'],
      name: 'billing_item_usage_idx'
    }
  ]
});

ServiceBilling.belongsToMany(ServiceUsage, { 
  through: ServiceBillingItem, 
  foreignKey: 'serviceBillingId', 
  otherKey: 'serviceUsageId',
  as: 'usages'
});

ServiceUsage.belongsToMany(ServiceBilling, { 
  through: ServiceBillingItem, 
  foreignKey: 'serviceUsageId', 
  otherKey: 'serviceBillingId',
  as: 'billings'
});

const db = { 
  sequelize, 
  User, 
  Product, 
  Category, 
  Cart, 
  CartItem, 
  Order, 
  OrderItem,
  Auction,
  Bid,
  ServiceUsage,
  ServiceBilling,
  ServiceBillingItem
};

// Sync models with database
db.sequelize.sync({ alter: true })
  .then(() => console.log("Database & tables created!"))
  .catch(err => console.error("Error syncing database:", err));

module.exports = db;
