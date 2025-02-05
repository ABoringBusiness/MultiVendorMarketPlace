'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      shipping_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'unpaid',
      },
    },
    {
      tableName: 'orders',
      schema: 'marketplace',
      underscored: true,
      timestamps: true,
    }
  );

  Order.associate = function (models) {
    // Order belongs to a user
    Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    // Order has many order items
    Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
  };

  return Order;
};
