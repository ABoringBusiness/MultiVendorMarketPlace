const sequelize = require("../config/database");
const User = require("./User");

const db = { sequelize, User };

// Sync models with database
db.sequelize.sync({ alter: true })
  .then(() => console.log("Database & tables created!"))
  .catch(err => console.error("Error syncing database:", err));

module.exports = db;
