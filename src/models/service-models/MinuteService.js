const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../User');

const MinuteService = sequelize.define('MinuteService', {
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
  ratePerMinute: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  minimumMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  maximumMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maximumCharge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  }
}, {
  timestamps: true
});

// Associations
MinuteService.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });

module.exports = MinuteService;