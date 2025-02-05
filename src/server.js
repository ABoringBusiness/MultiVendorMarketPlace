// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Swagger Integration (only in development mode)
if (process.env.NODE_ENV === 'development') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsDoc = require('swagger-jsdoc');
  
  // Define the Swagger specification details.
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Multivendor Marketplace API',
      version: '1.0.0',
      description: 'API documentation for admin and end-user endpoints',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Endpoints for authentication' },
      { name: 'User', description: 'Endpoints for user management' },
      { name: 'Product', description: 'Endpoints for product management' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  // Options for swagger-jsdoc (where annotations are located)
  const swaggerJsDocOptions = {
    swaggerDefinition,
    apis: ['./src/routes/*.js', './src/controllers/*.js'],
  };

  const swaggerDocs = swaggerJsDoc(swaggerJsDocOptions);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
