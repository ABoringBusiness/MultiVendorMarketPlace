'use strict';

const { Cart, CartItem, Product } = require('../../models');

/**
 * Get the current user's cart. If no cart exists, create one.
 */
exports.getCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    let cart = await Cart.findOne({
      where: { user_id },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });
    if (!cart) {
      cart = await Cart.create({ user_id });
    }
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add an item to the current user's cart.
 */
exports.addItemToCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id, quantity } = req.body;

    // Find or create the user's cart
    let cart = await Cart.findOne({ where: { user_id } });
    if (!cart) {
      cart = await Cart.create({ user_id });
    }

    // Check if the item already exists in the cart
    let item = await CartItem.findOne({
      where: { cart_id: cart.id, product_id },
    });
    if (item) {
      // Update quantity if the item already exists
      item.quantity += quantity || 1;
      await item.save();
    } else {
      // Otherwise, create a new cart item
      item = await CartItem.create({
        cart_id: cart.id,
        product_id,
        quantity: quantity || 1,
      });
    }
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update the quantity of a cart item.
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params; // Cart item ID
    const { quantity } = req.body;

    let item = await CartItem.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Cart item not found.' });

    item.quantity = quantity;
    await item.save();
    res.json({ item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove a cart item.
 */
exports.removeCartItem = async (req, res) => {
  try {
    const { id } = req.params; // Cart item ID
    const item = await CartItem.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Cart item not found.' });
    await item.destroy();
    res.json({ message: 'Item removed from cart.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Clear the current user's cart.
 */
exports.clearCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const cart = await Cart.findOne({ where: { user_id } });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    await CartItem.destroy({ where: { cart_id: cart.id } });
    res.json({ message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
