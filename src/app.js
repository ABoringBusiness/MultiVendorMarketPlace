const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);

// Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

module.exports = app;
