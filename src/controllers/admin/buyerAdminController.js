const { User, Order, Product, Review, Sequelize } = require('../../models');
const { Op } = Sequelize;

// @desc Get buyer dashboard
// @route GET /api/admin/buyer/dashboard
exports.getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Validate buyer
    const buyer = await User.findOne({
      where: { id: buyerId, role: 'buyer' },
      attributes: { exclude: ['password'] }
    });

    if (!buyer) {
      return res.status(403).json({ message: 'Access denied. Buyer account required.' });
    }

    // Get total orders
    const totalOrders = await Order.count({
      where: { buyerId }
    });

    // Get recent orders (last 30 days)
    const recentOrders = await Order.count({
      where: {
        buyerId,
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get total spent
    const spentResult = await Order.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total')), 'totalSpent']
      ],
      where: { buyerId, status: { [Op.ne]: 'cancelled' } },
      raw: true
    });

    const totalSpent = spentResult[0].totalSpent || 0;

    // Get recent spent (last 30 days)
    const recentSpentResult = await Order.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('total')), 'recentSpent']
      ],
      where: {
        buyerId,
        status: { [Op.ne]: 'cancelled' },
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      raw: true
    });

    const recentSpent = recentSpentResult[0].recentSpent || 0;

    // Get total reviews
    const totalReviews = await Review.count({
      where: { userId: buyerId }
    });

    // Get wishlist count
    const wishlistCount = await Wishlist.count({
      where: { userId: buyerId }
    });

    // Get order status counts
    const pendingOrders = await Order.count({
      where: { buyerId, status: 'pending' }
    });

    const processingOrders = await Order.count({
      where: { buyerId, status: 'processing' }
    });

    const shippedOrders = await Order.count({
      where: { buyerId, status: 'shipped' }
    });

    const deliveredOrders = await Order.count({
      where: { buyerId, status: 'delivered' }
    });

    const cancelledOrders = await Order.count({
      where: { buyerId, status: 'cancelled' }
    });

    // Get recent purchases
    const recentPurchases = await Order.findAll({
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: ['quantity', 'price'] }
        }
      ],
      where: { buyerId },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get monthly spending data for chart
    const currentDate = new Date();
    const sixMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 6));

    const monthlySpending = await Order.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt')), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'spent'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount']
      ],
      where: {
        buyerId,
        status: { [Op.ne]: 'cancelled' },
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt'))],
      order: [[Sequelize.literal('month'), 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          recent: recentOrders,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        spending: {
          total: totalSpent,
          recent: recentSpent
        },
        reviews: {
          total: totalReviews
        },
        wishlist: {
          total: wishlistCount
        },
        recentPurchases,
        monthlySpending
      }
    });
  } catch (error) {
    console.error('Buyer dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get buyer orders
// @route GET /api/admin/buyer/orders
exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10, status, search, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = { buyerId };

    if (status) {
      whereConditions.status = status;
    }

    if (dateFrom) {
      whereConditions.createdAt = { ...whereConditions.createdAt, [Op.gte]: new Date(dateFrom) };
    }

    if (dateTo) {
      whereConditions.createdAt = { ...whereConditions.createdAt, [Op.lte]: new Date(dateTo) };
    }

    // Search in order ID or product name
    if (search) {
      whereConditions[Op.or] = [
        { id: { [Op.iLike]: `%${search}%` } },
        { '$products.title$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get orders with pagination
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: ['quantity', 'price'] },
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email']
            }
          ]
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
    console.error('Get buyer orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get order details
// @route GET /api/admin/buyer/orders/:id
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    // Find the order
    const order = await Order.findOne({
      where: { id, buyerId },
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: ['quantity', 'price'] },
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        },
        {
          model: Address,
          as: 'shippingAddress'
        },
        {
          model: Payment,
          attributes: ['id', 'method', 'amount', 'status', 'transactionId', 'createdAt']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get order tracking info if available
    let tracking = null;
    if (order.trackingId) {
      tracking = await Tracking.findOne({
        where: { id: order.trackingId }
      });
    }

    res.status(200).json({
      success: true,
      order,
      tracking
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Cancel order
// @route PUT /api/admin/buyer/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const buyerId = req.user.id;

    // Find the order
    const order = await Order.findOne({
      where: { id, buyerId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by buyer';
    order.cancelledAt = new Date();
    await order.save();

    // Handle refund logic if payment was made
    if (order.isPaid) {
      // Implement refund logic or create refund request
      await Refund.create({
        orderId: id,
        amount: order.total,
        reason: reason || 'Order cancelled by buyer',
        status: 'pending'
      });
    }

    // Restore product stock
    const orderItems = await OrderItem.findAll({
      where: { orderId: id }
    });

    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId);
      product.stockQuantity += item.quantity;
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get buyer reviews
// @route GET /api/admin/buyer/reviews
exports.getBuyerReviews = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10, rating, productId } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = { userId: buyerId };

    if (rating) {
      whereConditions.rating = rating;
    }

    if (productId) {
      whereConditions.productId = productId;
    }

    // Get reviews with pagination
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Product,
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'email']
            }
          ]
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
    console.error('Get buyer reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Create or update review
// @route POST /api/admin/buyer/reviews
exports.createOrUpdateReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment, title } = req.body;
    const buyerId = req.user.id;

    // Validate required fields
    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and rating are required' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If orderId is provided, verify that the buyer purchased this product
    if (orderId) {
      const orderItem = await OrderItem.findOne({
        where: { productId },
        include: [
          {
            model: Order,
            where: { id: orderId, buyerId, status: 'delivered' }
          }
        ]
      });

      if (!orderItem) {
        return res.status(403).json({ message: 'You can only review products you have purchased and received' });
      }
    } else {
      // If no orderId, check if buyer has purchased this product
      const hasPurchased = await OrderItem.findOne({
        where: { productId },
        include: [
          {
            model: Order,
            where: { buyerId, status: 'delivered' }
          }
        ]
      });

      if (!hasPurchased) {
        return res.status(403).json({ message: 'You can only review products you have purchased and received' });
      }
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      where: { userId: buyerId, productId }
    });

    let review;
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      if (comment) existingReview.comment = comment;
      if (title) existingReview.title = title;
      existingReview.updatedAt = new Date();
      
      review = await existingReview.save();
    } else {
      // Create new review
      review = await Review.create({
        userId: buyerId,
        productId,
        orderId,
        rating,
        comment: comment || '',
        title: title || ''
      });
    }

    // Update product average rating
    const productReviews = await Review.findAll({
      where: { productId },
      attributes: ['rating']
    });

    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / productReviews.length;

    product.averageRating = averageRating;
    product.totalRatings = productReviews.length;
    await product.save();

    res.status(200).json({
      success: true,
      message: existingReview ? 'Review updated successfully' : 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create/update review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Delete review
// @route DELETE /api/admin/buyer/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    // Find the review
    const review = await Review.findOne({
      where: { id, userId: buyerId }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Delete review
    await review.destroy();

    // Update product average rating
    const productId = review.productId;
    const productReviews = await Review.findAll({
      where: { productId },
      attributes: ['rating']
    });

    const product = await Product.findByPk(productId);
    
    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / productReviews.length;
      
      product.averageRating = averageRating;
      product.totalRatings = productReviews.length;
    } else {
      product.averageRating = 0;
      product.totalRatings = 0;
    }
    
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get buyer wishlist
// @route GET /api/admin/buyer/wishlist
exports.getBuyerWishlist = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get wishlist with pagination
    const { count, rows: wishlistItems } = await Wishlist.findAndCountAll({
      where: { userId: buyerId },
      include: [
        {
          model: Product,
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name']
            }
          ]
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
      wishlistItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get buyer wishlist error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Add to wishlist
// @route POST /api/admin/buyer/wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.id;

    // Validate product ID
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      where: { userId: buyerId, productId }
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      userId: buyerId,
      productId
    });

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Remove from wishlist
// @route DELETE /api/admin/buyer/wishlist/:id
exports.removeFromWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    // Find wishlist item
    const wishlistItem = await Wishlist.findOne({
      where: { id, userId: buyerId }
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    // Remove from wishlist
    await wishlistItem.destroy();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get buyer profile
// @route GET /api/admin/buyer/profile
exports.getBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get buyer profile
    const buyer = await User.findOne({
      where: { id: buyerId, role: 'buyer' },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Address,
          as: 'addresses'
        }
      ]
    });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.status(200).json({
      success: true,
      buyer
    });
  } catch (error) {
    console.error('Get buyer profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update buyer profile
// @route PUT /api/admin/buyer/profile
exports.updateBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { name, email, phone, avatar } = req.body;

    // Get buyer profile
    const buyer = await User.findOne({
      where: { id: buyerId, role: 'buyer' }
    });

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Update buyer
    if (name) buyer.name = name;
    if (email) buyer.email = email;
    if (phone) buyer.phone = phone;
    if (avatar) buyer.avatar = avatar;

    await buyer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      buyer: {
        ...buyer.toJSON(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Update buyer profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};