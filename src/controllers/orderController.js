const { Order, OrderItem, Product, Cart, CartItem, User } = require("../models");

// @desc Create a new order from cart
// @route POST /api/orders/create
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;
    
    // Find user's cart
    const cart = await Cart.findOne({ 
      where: { userId },
      include: [{
        model: CartItem,
        as: "items",
        include: [{
          model: Product,
          as: "product"
        }]
      }]
    });
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    
    // Calculate order total and prepare order items
    let total = 0;
    const orderItemsData = cart.items.map(item => {
      const unitPrice = item.product.price;
      const quantity = item.quantity;
      const totalPrice = unitPrice * quantity;
      
      total += totalPrice;
      
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        totalPrice
      };
    });
    
    // Create order
    const order = await Order.create({
      userId,
      total,
      shippingAddress: shippingAddress || null,
      status: "pending",
      paymentStatus: "unpaid"
    });
    
    // Create order items
    await Promise.all(
      orderItemsData.map(itemData => 
        OrderItem.create({
          ...itemData,
          orderId: order.id
        })
      )
    );
    
    // Clear cart after order creation
    await CartItem.destroy({ where: { cartId: cart.id } });
    
    // Get order with items
    const orderWithItems = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: "items",
        include: [{
          model: Product,
          as: "product"
        }]
      }]
    });
    
    res.status(201).json({
      message: "Order created successfully",
      order: orderWithItems
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all orders for the authenticated user
// @route GET /api/orders/list
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await Order.findAll({
      where: { userId },
      include: [{
        model: OrderItem,
        as: "items",
        include: [{
          model: Product,
          as: "product",
          attributes: ["id", "title", "price", "imageUrl"]
        }]
      }],
      order: [["createdAt", "DESC"]]
    });
    
    res.json({ orders });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get order details by ID
// @route GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const order = await Order.findOne({
      where: { 
        id,
        userId // Ensure user can only access their own orders
      },
      include: [{
        model: OrderItem,
        as: "items",
        include: [{
          model: Product,
          as: "product",
          attributes: ["id", "title", "price", "imageUrl", "sellerId"]
        }]
      }]
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ order });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update order status (Seller/Admin only)
// @route PUT /api/orders/:id/update-status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    if (!status || !["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Find the order with items
    const order = await Order.findByPk(id, {
      include: [{
        model: OrderItem,
        as: "items",
        include: [{
          model: Product,
          as: "product"
        }]
      }]
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user is seller of any product in the order or admin
    const isSeller = order.items.some(item => item.product.sellerId === userId);
    const isAdmin = req.user.role === "admin";
    
    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get seller's orders
// @route GET /api/orders/seller
exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    if (req.user.role !== "seller" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Find all orders that contain products sold by this seller
    const orders = await Order.findAll({
      include: [{
        model: OrderItem,
        as: "items",
        required: true,
        include: [{
          model: Product,
          as: "product",
          required: true,
          where: { sellerId }
        }]
      }],
      order: [["createdAt", "DESC"]]
    });
    
    res.json({ orders });
  } catch (error) {
    console.error("Get seller orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
