'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure the schema exists (if not already created by a dedicated migration)
    await queryInterface.createSchema('marketplace', { ifNotExists: true });

    await queryInterface.createTable(
      { schema: 'marketplace', tableName: 'products' },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        vendor_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          // Assuming vendors are stored in the "users" table with a vendor role
          references: {
            model: { schema: 'marketplace', tableName: 'users' },
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        inventory_quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        category: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        image_url: {
          type: Sequelize.STRING,
          allowNull: true,
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
    await queryInterface.dropTable({ schema: 'marketplace', tableName: 'products' });
  },
};
