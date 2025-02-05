'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table in the "marketplace" schema.
    await queryInterface.createTable(
      { schema: 'marketplace', tableName: 'users' },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        role: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'buyer', // default role
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table from the "marketplace" schema.
    await queryInterface.dropTable({ schema: 'marketplace', tableName: 'users' });
  },
};
