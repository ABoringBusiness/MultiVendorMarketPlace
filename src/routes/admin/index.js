const express = require('express');
const router = express.Router();
const sellerAdminRoutes = require('./sellerAdminRoutes');
const buyerAdminRoutes = require('./buyerAdminRoutes');

// Mount seller admin routes
router.use('/seller', sellerAdminRoutes);

// Mount buyer admin routes
router.use('/buyer', buyerAdminRoutes);

module.exports = router;