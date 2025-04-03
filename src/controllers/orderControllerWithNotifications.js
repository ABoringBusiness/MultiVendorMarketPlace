const { Order, OrderItem, Product, User } = require('../models');
const { orderNotifications } = require('../utils/notificationHelpers');

// @desc Create a new order
// @route POST /api/orders/create
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress, paymentMethod } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }
    
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    
    // Calculate order totals by fetching product details
    let total = 0;
    const orderItemsData = await Promise.all(
      items.map(async (item) => {
        // Fetch product to get unit price
        const product = await Product.findByPk(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        
        const unitPrice = parseFloat(product.price);
        const quantity = item.quantity || 1;
        const subtotal = unitPrice * quantity;
        
        total += subtotal;
        
        return {
          productId: item.productId,
          quantity,
          unitPrice,
          subtotal
        };
      })
    );
    
    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().substring(0, 10)}`;
    
    // Create order
    const order = await Order.create({
      userId,
      orderNumber,
      total,
      status: 'pending',
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending'
    });
    
    // Create order items
    await Promise.all(
      orderItemsData.map(item => 
        OrderItem.create({
          orderId: order.id,
          ...item
        })
      )
    );
    
    // Get buyer for notification
    const buyer = await User.findByPk(userId);
    
    // Send notification to buyer
    await orderNotifications.orderCreated(order, buyer);
    
    // Get unique seller IDs from products
    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ['sellerId']
    });
    
    const sellerIds = [...new Set(products.map(product => product.sellerId))];
    
    // Send notifications to sellers
    await Promise.all(
      sellerIds.map(async (sellerId) => {
        const seller = await User.findByPk(sellerId);
        await orderNotifications.newOrderReceived(order, seller);
      })
    );
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get list of buyer's orders
// @route GET /api/orders/list
exports.getBuyerOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Build where condition
    const whereCondition = { userId };
    
    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    }
    
    // Get orders
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'title', 'imageUrl'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get order details
// @route GET /api/orders/:id
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find order
    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'title', 'description', 'imageUrl', 'sellerId'] }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is the buyer or a seller of any product in the order
    const isBuyer = order.userId === userId;
    const isSeller = order.OrderItems.some(item => item.Product.sellerId === userId);
    
    if (!isBuyer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Update order status (Seller/Admin only)
// @route PUT /api/orders/:id/update-status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find order
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['sellerId'] }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is a seller of any product in the order or an admin
    const isSeller = order.OrderItems.some(item => item.Product.sellerId === userId);
    
    if (!isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    // Get buyer for notification
    const buyer = await User.findByPk(order.userId);
    
    // Send notification to buyer
    await orderNotifications.orderStatusUpdated(order, buyer);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get seller's orders
// @route GET /api/orders/seller
exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get products by seller
    const products = await Product.findAll({
      where: { sellerId },
      attributes: ['id']
    });
    
    const productIds = products.map(product => product.id);
    
    if (productIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        orders: []
      });
    }
    
    // Get order items for these products
    const orderItems = await OrderItem.findAll({
      where: { productId: productIds },
      attributes: ['orderId']
    });
    
    const orderIds = [...new Set(orderItems.map(item => item.orderId))];
    
    if (orderIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        orders: []
      });
    }
    
    // Build where condition
    const whereCondition = { id: orderIds };
    
    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    }
    
    // Get orders
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'title', 'imageUrl', 'sellerId'] }]
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Filter order items to only include seller's products
    orders.forEach(order => {
      order.OrderItems = order.OrderItems.filter(item => item.Product.sellerId === sellerId);
    });
    
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};