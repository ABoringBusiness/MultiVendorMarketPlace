const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../User');
const MinuteService = require('./MinuteService');

const ServiceSession = sequelize.define('ServiceSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded', 'disputed'),
    defaultValue: 'pending'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

// Associations
ServiceSession.belongsTo(User, { as: 'user', foreignKey: 'userId' });
ServiceSession.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });
ServiceSession.belongsTo(MinuteService, { as: 'service', foreignKey: 'serviceId' });

module.exports = ServiceSession;