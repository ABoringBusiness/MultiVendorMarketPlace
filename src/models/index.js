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

// Define PennyAuction model
const PennyAuction = sequelize.define("PennyAuction", {
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
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  retailPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  startingPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  currentPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  bidIncrement: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.01, // Default penny increment
  },
  bidCost: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.50, // Default cost per bid
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  timerSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10, // Default timer extension in seconds
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // pending, active, completed, cancelled
  },
  highestBidderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "Users",
      key: "id",
    },
  },
  totalBids: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isDisabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['categoryId'],
      name: 'penny_auction_category_idx'
    },
    {
      fields: ['sellerId'],
      name: 'penny_auction_seller_idx'
    },
    {
      fields: ['startTime', 'endTime'],
      name: 'penny_auction_time_idx'
    },
    {
      fields: ['status'],
      name: 'penny_auction_status_idx'
    },
    {
      fields: ['featured'],
      name: 'penny_auction_featured_idx'
    }
  ]
});

// Define PennyBid model
const PennyBid = sequelize.define("PennyBid", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pennyAuctionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "PennyAuctions",
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
  bidAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  bidCost: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  newPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  timerExtended: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isAutoBid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['pennyAuctionId'],
      name: 'penny_bid_auction_idx'
    },
    {
      fields: ['bidderId'],
      name: 'penny_bid_bidder_idx'
    },
    {
      fields: ['createdAt'],
      name: 'penny_bid_time_idx'
    }
  ]
});

// Define BidPackage model for penny auctions
const BidPackage = sequelize.define("BidPackage", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bidCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  discountPercentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['isActive'],
      name: 'bid_package_active_idx'
    },
    {
      fields: ['featured'],
      name: 'bid_package_featured_idx'
    }
  ]
});

// Define UserBidBalance model
const UserBidBalance = sequelize.define("UserBidBalance", {
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
  bidBalance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalBidsPurchased: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalBidsUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastPurchaseDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
      name: 'user_bid_balance_user_idx',
      unique: true
    }
  ]
});

// Define BidTransaction model
const BidTransaction = sequelize.define("BidTransaction", {
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
  bidPackageId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "BidPackages",
      key: "id",
    },
    onDelete: "SET NULL",
  },
  transactionType: {
    type: DataTypes.STRING,
    allowNull: false,
    // Types: 'purchase', 'use', 'refund', 'bonus', 'expiry'
  },
  bidCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // pending, completed, failed, refunded
  },
  stripeSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
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
      name: 'bid_transaction_user_idx'
    },
    {
      fields: ['bidPackageId'],
      name: 'bid_transaction_package_idx'
    },
    {
      fields: ['transactionType'],
      name: 'bid_transaction_type_idx'
    },
    {
      fields: ['paymentStatus'],
      name: 'bid_transaction_status_idx'
    },
    {
      fields: ['createdAt'],
      name: 'bid_transaction_time_idx'
    }
  ]
});

// Define AutoBidConfig model
const AutoBidConfig = sequelize.define("AutoBidConfig", {
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
  pennyAuctionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "PennyAuctions",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  maxBids: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bidsUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  stopWhenOutbid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  bidDelaySec: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
      name: 'auto_bid_user_idx'
    },
    {
      fields: ['pennyAuctionId'],
      name: 'auto_bid_auction_idx'
    },
    {
      fields: ['isActive'],
      name: 'auto_bid_active_idx'
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

// Penny Auction associations
User.hasMany(PennyAuction, { foreignKey: "sellerId", as: "pennyAuctions" });
PennyAuction.belongsTo(User, { foreignKey: "sellerId", as: "seller" });

User.hasMany(PennyAuction, { foreignKey: "highestBidderId", as: "wonPennyAuctions" });
PennyAuction.belongsTo(User, { foreignKey: "highestBidderId", as: "highestBidder" });

Category.hasMany(PennyAuction, { foreignKey: "categoryId" });
PennyAuction.belongsTo(Category, { foreignKey: "categoryId" });

// Penny Bid associations
User.hasMany(PennyBid, { foreignKey: "bidderId", as: "pennyBids" });
PennyBid.belongsTo(User, { foreignKey: "bidderId", as: "bidder" });

PennyAuction.hasMany(PennyBid, { foreignKey: "pennyAuctionId", as: "bids" });
PennyBid.belongsTo(PennyAuction, { foreignKey: "pennyAuctionId", as: "pennyAuction" });

// Bid Balance associations
User.hasOne(UserBidBalance, { foreignKey: "userId", as: "bidBalance" });
UserBidBalance.belongsTo(User, { foreignKey: "userId" });

// Bid Transaction associations
User.hasMany(BidTransaction, { foreignKey: "userId", as: "bidTransactions" });
BidTransaction.belongsTo(User, { foreignKey: "userId" });

BidPackage.hasMany(BidTransaction, { foreignKey: "bidPackageId", as: "transactions" });
BidTransaction.belongsTo(BidPackage, { foreignKey: "bidPackageId", as: "bidPackage" });

// Auto Bid Config associations
User.hasMany(AutoBidConfig, { foreignKey: "userId", as: "autoBidConfigs" });
AutoBidConfig.belongsTo(User, { foreignKey: "userId" });

PennyAuction.hasMany(AutoBidConfig, { foreignKey: "pennyAuctionId", as: "autoBidConfigs" });
AutoBidConfig.belongsTo(PennyAuction, { foreignKey: "pennyAuctionId", as: "pennyAuction" });

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
  ServiceBillingItem,
  PennyAuction,
  PennyBid,
  BidPackage,
  UserBidBalance,
  BidTransaction,
  AutoBidConfig
};

// Sync models with database
db.sequelize.sync({ alter: true })
  .then(() => console.log("Database & tables created!"))
  .catch(err => console.error("Error syncing database:", err));

module.exports = db;
