const sequelize = require("../config/database");
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const Notification = require("./Notification");

const db = { sequelize, User, Product, Category, Notification};

// Sync models with database
db.sequelize.sync({ alter: true })
  .then(() => console.log("Database & tables created!"))
  .catch(err => console.error("Error syncing database:", err));

module.exports = db;
