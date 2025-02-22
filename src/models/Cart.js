'use strict';
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    'Cart',
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
    },
    {
      tableName: 'carts',
      schema: 'marketplace',
      underscored: true,
      timestamps: true,
    }
  );

  Cart.associate = function(models) {
    Cart.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Cart.hasMany(models.CartItem, { foreignKey: 'cart_id', as: 'items' });
  };

  return Cart;
};
