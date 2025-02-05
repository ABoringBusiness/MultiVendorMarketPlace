'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure the "marketplace" schema exists
    await queryInterface.createSchema('marketplace', { ifNotExists: true });

    await queryInterface.createTable(
      { schema: 'marketplace', tableName: 'order_items' },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        order_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: { schema: 'marketplace', tableName: 'orders' },
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        product_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: { schema: 'marketplace', tableName: 'products' },
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        unit_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        total_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
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
    await queryInterface.dropTable({ schema: 'marketplace', tableName: 'order_items' });
  },
};
