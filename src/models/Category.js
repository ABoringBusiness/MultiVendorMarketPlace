'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'categories',
      schema: 'marketplace', // use the custom schema
      underscored: true,     // maps auto-generated fields to snake_case (e.g., created_at)
      timestamps: true,
    }
  );

  Category.associate = function (models) {
    // Optionally, if you wish to associate products with categories:
    // Category.hasMany(models.Product, { foreignKey: 'category_id', as: 'products' });
  };

  return Category;
};
