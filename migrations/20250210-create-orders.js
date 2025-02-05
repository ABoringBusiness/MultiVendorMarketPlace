'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure the "marketplace" schema exists
    await queryInterface.createSchema('marketplace', { ifNotExists: true });

    await queryInterface.createTable(
      { schema: 'marketplace', tableName: 'orders' },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: { schema: 'marketplace', tableName: 'users' },
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        total: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'pending', // e.g., pending, confirmed, shipped, delivered, cancelled
        },
        shipping_address: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        payment_status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'unpaid', // or 'paid'
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
    await queryInterface.dropTable({ schema: 'marketplace', tableName: 'orders' });
  },
};
