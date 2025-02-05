'use strict';

const { Order, OrderItem, Product } = require('../../models');

/**
 * Create a new order.
 * This example assumes that the request body includes an array of items.
 * Each item should include product_id and quantity.
 * In a real-world scenario, you might calculate totals, handle payment, etc.
 */
exports.createOrder = async (req, res) => {
  try {
    const user_id = req.user.id; // Authenticated user's ID
    const { items, shipping_address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided.' });
    }

    // Calculate order totals by fetching product details.
    let total = 0;
    const orderItemsData = await Promise.all(
      items.map(async (item) => {
        // Fetch product to get unit price
        const product = await Product.findByPk(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found.`);
        }
        const unit_price = parseFloat(product.price);
        const quantity = item.quantity || 1;
        const total_price = unit_price * quantity;
        total += total_price;
        return {
          product_id: item.product_id,
          quantity,
          unit_price,
          total_price,
        };
      })
    );

    // Create the order record
    const order = await Order.create({
      user_id,
      total,
      shipping_address: shipping_address || null,
      status: 'pending',
      payment_status: 'unpaid',
    });

    // Create order items associated with the order
    const orderItems = await Promise.all(
      orderItemsData.map(async (itemData) => {
        itemData.order_id = order.id;
        return await OrderItem.create(itemData);
      })
    );

    // Reload order to include order items
    const orderDetails = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
    });

    res.status(201).json({ order: orderDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all orders for the authenticated user.
 */
exports.getUserOrders = async (req, res) => {
  try {
    const user_id = req.user.id;
    const orders = await Order.findAll({
      where: { user_id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
      order: [['created_at', 'DESC']],
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get details for a single order by ID.
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
    });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
