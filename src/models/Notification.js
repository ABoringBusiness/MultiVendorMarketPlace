const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define("Notification", {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    // Types: 'order', 'auction', 'bid', 'payment', 'system', etc.
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  actionLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
      name: 'notification_user_idx'
    },
    {
      fields: ['isRead'],
      name: 'notification_read_idx'
    },
    {
      fields: ['type'],
      name: 'notification_type_idx'
    },
    {
      fields: ['createdAt'],
      name: 'notification_created_idx'
    }
  ]
});

module.exports = Notification;