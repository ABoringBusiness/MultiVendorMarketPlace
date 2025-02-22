const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert("Users", [
      {
        id: "1e81c5e5-5b55-4a36-9b57-8308fd2548cd", // You can generate a UUID manually
        name: "Admin User",
        email: "admin@marketplace.com",
        password: await bcrypt.hash("admin123", 10), // Hashed password
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete("Users", { email: "admin@marketplace.com" }, {});
  },
};
