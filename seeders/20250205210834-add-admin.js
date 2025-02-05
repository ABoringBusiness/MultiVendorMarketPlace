'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Define superadmin details
    const superAdminPassword = 'superadminpassword'; // Change this to your default password
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    // Insert the default superadmin record into the marketplace.users table
    await queryInterface.bulkInsert(
      { schema: 'marketplace', tableName: 'users' },
      [
        {
          name: 'Super Admin',
          email: 'superadmin@example.com',
          password: hashedPassword,
          role: 'superadmin', // Role can be 'superadmin'
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the default superadmin record based on the email
    await queryInterface.bulkDelete(
      { schema: 'marketplace', tableName: 'users' },
      { email: 'superadmin@example.com' },
      {}
    );
  },
};
