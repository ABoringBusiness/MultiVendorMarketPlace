const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../User');
const Category = require('../Category');

const DigitalProduct = sequelize.define('DigitalProduct', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  salePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  previewUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryType: {
    type: DataTypes.ENUM('download', 'access_key', 'online_access'),
    allowNull: false
  },
  licenseType: {
    type: DataTypes.ENUM('single_user', 'multi_user', 'subscription'),
    allowNull: false,
    defaultValue: 'single_user'
  },
  subscriptionPeriod: {
    type: DataTypes.ENUM('monthly', 'yearly', null),
    allowNull: true
  },
  downloadLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isWatermarked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'inactive'),
    defaultValue: 'draft'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  allowAffiliates: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  affiliateCommissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10.00 // 10%
  }
}, {
  timestamps: true
});

// Associations
DigitalProduct.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
DigitalProduct.belongsTo(Category, { foreignKey: 'categoryId' });

module.exports = DigitalProduct;