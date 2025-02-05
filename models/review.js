'use strict';

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    'Review',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'reviews',
      schema: 'marketplace',
      underscored: true, // Automatically map createdAt/updatedAt to created_at/updated_at
      timestamps: true,
    }
  );

  Review.associate = function (models) {
    // Each review belongs to a product.
    Review.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    // Each review belongs to a user (the reviewer).
    Review.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Review;
};
