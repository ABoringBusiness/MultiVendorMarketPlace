'use strict';
module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    'CartItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: 'cart_items',
      schema: 'marketplace',
      underscored: true,
      timestamps: true,
    }
  );

  CartItem.associate = function(models) {
    CartItem.belongsTo(models.Cart, { foreignKey: 'cart_id', as: 'cart' });
    CartItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return CartItem;
};
