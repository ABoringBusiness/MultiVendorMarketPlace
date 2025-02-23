const sequelize = require("../config/database");
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");

const db = { sequelize, User, Product, Category};

// Sync models with database
db.sequelize.sync({ alter: true })
  .then(() => console.log("Database & tables created!"))
  .catch(err => console.error("Error syncing database:", err));

module.exports = db;
