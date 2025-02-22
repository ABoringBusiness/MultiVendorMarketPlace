const app = require("./src/app");
const sequelize = require("./src/config/database");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.error("Database connection failed:", err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
