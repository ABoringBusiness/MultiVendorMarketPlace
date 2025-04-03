const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../User');
const DigitalProduct = require('./DigitalProduct');

const DigitalPurchase = sequelize.define('DigitalPurchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'refunded', 'cancelled'),
    defaultValue: 'pending'
  },
  accessDetails: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  accessExpiration: {
    type: DataTypes.DATE,
    allowNull: true
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastDownloadDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  affiliateId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  affiliateCommission: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  timestamps: true
});

// Associations
DigitalPurchase.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
DigitalPurchase.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
DigitalPurchase.belongsTo(DigitalProduct, { as: 'product', foreignKey: 'productId' });
DigitalPurchase.belongsTo(User, { as: 'affiliate', foreignKey: 'affiliateId' });

module.exports = DigitalPurchase;