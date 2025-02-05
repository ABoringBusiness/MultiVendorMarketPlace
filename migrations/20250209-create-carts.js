'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure the schema exists
    await queryInterface.createSchema('marketplace', { ifNotExists: true });

    await queryInterface.createTable(
      { schema: 'marketplace', tableName: 'carts' },
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
    await queryInterface.dropTable({ schema: 'marketplace', tableName: 'carts' });
  },
};
