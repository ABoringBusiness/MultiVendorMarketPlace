const { User, Product, Order, Review, Sequelize } = require('../../models');
const { Op } = Sequelize;

// @desc Get seller dashboard statistics
// @route GET /api/admin/seller/dashboard
exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Validate seller
    const seller = await User.findOne({
      where: { id: sellerId, role: 'seller' },
      attributes: { exclude: ['password'] }
    });

    if (!seller) {
      return res.status(403).json({ message: 'Access denied. Seller account required.' });
    }

    // Get total products
    const totalProducts = await Product.count({
      where: { sellerId }
    });

    // Get active products
    const activeProducts = await Product.count({
      where: { sellerId, isActive: true }
    });

    // Get total orders
    const totalOrders = await Order.count({
      include: [
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ]
    });

    // Get recent orders (last 30 days)
    const recentOrders = await Order.count({
      include: [
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get total revenue
    const revenueResult = await Order.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'totalRevenue']
      ],
      include: [
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ],
      raw: true
    });

    const totalRevenue = revenueResult[0].totalRevenue || 0;

    // Get recent revenue (last 30 days)
    const recentRevenueResult = await Order.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'recentRevenue']
      ],
      include: [
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      raw: true
    });

    const recentRevenue = recentRevenueResult[0].recentRevenue || 0;

    // Get average rating
    const ratingResult = await Review.findAll({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalReviews']
      ],
      include: [
        {
          model: Product,
          where: { sellerId },
          required: true
        }
      ],
      raw: true
    });

    const averageRating = ratingResult[0].averageRating || 0;
    const totalReviews = ratingResult[0].totalReviews || 0;

    // Get top selling products
    const topProducts = await Product.findAll({
      attributes: [
        'id',
        'title',
        'price',
        [Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('OrderItem.quantity')), 'totalQuantity']
      ],
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: []
        }
      ],
      where: { sellerId },
      group: ['Product.id'],
      order: [[Sequelize.literal('totalQuantity'), 'DESC']],
      limit: 5
    });

    // Get monthly sales data for chart
    const currentDate = new Date();
    const sixMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 6));

    const monthlySales = await Order.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('Order.createdAt')), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('OrderItem.price')), 'revenue'],
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orderCount']
      ],
      include: [
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ],
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('Order.createdAt'))],
      order: [[Sequelize.literal('month'), 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts
        },
        orders: {
          total: totalOrders,
          recent: recentOrders
        },
        revenue: {
          total: totalRevenue,
          recent: recentRevenue
        },
        reviews: {
          average: averageRating,
          total: totalReviews
        },
        topProducts,
        monthlySales
      }
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller products
// @route GET /api/admin/seller/products
exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, search, category, status } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = { sellerId };

    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      whereConditions.categoryId = category;
    }

    if (status) {
      whereConditions.isActive = status === 'active';
    }

    // Get products with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Category,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller orders
// @route GET /api/admin/seller/orders
exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status, search, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions for orders containing seller's products
    const whereConditions = {};

    if (status) {
      whereConditions.status = status;
    }

    if (dateFrom) {
      whereConditions.createdAt = { ...whereConditions.createdAt, [Op.gte]: new Date(dateFrom) };
    }

    if (dateTo) {
      whereConditions.createdAt = { ...whereConditions.createdAt, [Op.lte]: new Date(dateTo) };
    }

    // Search in order ID or buyer name/email
    if (search) {
      whereConditions[Op.or] = [
        { id: { [Op.iLike]: `%${search}%` } },
        { '$buyer.name$': { [Op.iLike]: `%${search}%` } },
        { '$buyer.email$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get orders with pagination
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update order status
// @route PUT /api/admin/seller/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    // Validate status
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the order
    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: Product,
          as: 'products',
          where: { sellerId },
          required: true
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or does not contain your products' });
    }

    // Update status
    order.status = status;
    await order.save();

    // If status is cancelled, handle refund logic here
    if (status === 'cancelled') {
      // Implement refund logic or notification
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller reviews
// @route GET /api/admin/seller/reviews
exports.getSellerReviews = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, rating, productId } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = {};
    const productWhereConditions = { sellerId };

    if (rating) {
      whereConditions.rating = rating;
    }

    if (productId) {
      productWhereConditions.id = productId;
    }

    // Get reviews with pagination
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Product,
          where: productWhereConditions,
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get seller reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Respond to a review
// @route POST /api/admin/seller/reviews/:id/respond
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const sellerId = req.user.id;

    // Validate response
    if (!response) {
      return res.status(400).json({ message: 'Response is required' });
    }

    // Find the review
    const review = await Review.findOne({
      where: { id },
      include: [
        {
          model: Product,
          where: { sellerId },
          required: true
        }
      ]
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or not for your product' });
    }

    // Update review with response
    review.sellerResponse = response;
    review.sellerResponseDate = new Date();
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller inventory
// @route GET /api/admin/seller/inventory
exports.getSellerInventory = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, lowStock, category } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = { sellerId };
    
    if (category) {
      whereConditions.categoryId = category;
    }

    if (lowStock === 'true') {
      whereConditions.stockQuantity = { [Op.lt]: 10 }; // Define low stock as less than 10
    }

    // Get inventory with pagination
    const { count, rows: inventory } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['stockQuantity', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get inventory statistics
    const outOfStock = await Product.count({
      where: {
        sellerId,
        stockQuantity: 0
      }
    });

    const lowStockCount = await Product.count({
      where: {
        sellerId,
        stockQuantity: { [Op.gt]: 0, [Op.lt]: 10 }
      }
    });

    res.status(200).json({
      success: true,
      count,
      inventory,
      stats: {
        outOfStock,
        lowStock: lowStockCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get seller inventory error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update inventory
// @route PUT /api/admin/seller/inventory/:id
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, price, isActive } = req.body;
    const sellerId = req.user.id;

    // Find the product
    const product = await Product.findOne({
      where: { id, sellerId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not yours' });
    }

    // Update product
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
    if (price !== undefined) product.price = price;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      product
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller profile
// @route GET /api/admin/seller/profile
exports.getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get seller profile
    const seller = await User.findOne({
      where: { id: sellerId, role: 'seller' },
      attributes: { exclude: ['password'] }
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.status(200).json({
      success: true,
      seller
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update seller profile
// @route PUT /api/admin/seller/profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { name, email, phone, address, description, logo, banner } = req.body;

    // Get seller profile
    const seller = await User.findOne({
      where: { id: sellerId, role: 'seller' }
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Update seller
    if (name) seller.name = name;
    if (email) seller.email = email;
    if (phone) seller.phone = phone;
    if (address) seller.address = address;
    if (description) seller.description = description;
    if (logo) seller.logo = logo;
    if (banner) seller.banner = banner;

    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      seller: {
        ...seller.toJSON(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};