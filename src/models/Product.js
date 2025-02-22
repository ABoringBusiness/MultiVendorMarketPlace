'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      inventory_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'products',
      schema: 'marketplace',
      underscored: true, // automatically maps createdAt/updatedAt to created_at/updated_at
      timestamps: true,
    }
  );

  Product.associate = function (models) {
    // Associate with the vendor (assuming vendors are stored in the "users" table)
    Product.belongsTo(models.User, { foreignKey: 'vendor_id', as: 'vendor' });
  };

  return Product;
};
