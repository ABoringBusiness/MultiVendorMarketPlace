'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
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
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'buyer',
      },
    },
    {
      tableName: 'users',       // Explicit table name.
      schema: 'marketplace',    // Specify the custom schema.
      underscored: true,        // Automatically maps camelCase to snake_case.
      timestamps: true,         // Enables Sequelize's automatic timestamp fields.
    }
  );

  return User;
};
