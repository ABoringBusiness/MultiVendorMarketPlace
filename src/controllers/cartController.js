const { Cart, CartItem, Product, User } = require("../models");

// @desc Get user's cart
// @route GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find or create cart
    let [cart, created] = await Cart.findOrCreate({
      where: { userId },
      defaults: { userId }
    });
    
    // Get cart items with product details
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        { 
          model: Product, 
          as: "product",
          attributes: ["id", "title", "price", "imageUrl"]
        }
      ]
    });
    
    // Calculate total
    let total = 0;
    cartItems.forEach(item => {
      if (item.product) {
        total += item.product.price * item.quantity;
      }
    });
    
    res.json({
      id: cart.id,
      items: cartItems,
      total,
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Add item to cart
// @route POST /api/cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    // Validate product exists and is not disabled
    const product = await Product.findOne({
      where: { id: productId, isDisabled: false }
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or unavailable" });
    }
    
    // Find or create cart
    let [cart, created] = await Cart.findOrCreate({
      where: { userId },
      defaults: { userId }
    });
    
    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });
    
    if (cartItem) {
      // Update quantity if item exists
      cartItem.quantity += parseInt(quantity);
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: parseInt(quantity)
      });
    }
    
    // Get updated cart
    const updatedCart = await getUpdatedCart(cart.id);
    
    res.status(201).json({
      message: "Item added to cart",
      cart: updatedCart
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update cart item
// @route PUT /api/cart/:itemId
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    
    // Find the cart item
    const cartItem = await CartItem.findByPk(itemId, {
      include: [{ model: Cart, where: { userId } }]
    });
    
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    
    // Update quantity
    cartItem.quantity = parseInt(quantity);
    await cartItem.save();
    
    // Get updated cart
    const updatedCart = await getUpdatedCart(cartItem.cartId);
    
    res.json({
      message: "Cart item updated",
      cart: updatedCart
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Remove item from cart
// @route DELETE /api/cart/:itemId
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    // Find the cart item
    const cartItem = await CartItem.findByPk(itemId, {
      include: [{ model: Cart, where: { userId } }]
    });
    
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    
    const cartId = cartItem.cartId;
    
    // Delete the cart item
    await cartItem.destroy();
    
    // Get updated cart
    const updatedCart = await getUpdatedCart(cartId);
    
    res.json({
      message: "Item removed from cart",
      cart: updatedCart
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Clear cart
// @route DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user's cart
    const cart = await Cart.findOne({ where: { userId } });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Delete all cart items
    await CartItem.destroy({ where: { cartId: cart.id } });
    
    res.json({
      message: "Cart cleared",
      cart: {
        id: cart.id,
        items: [],
        total: 0,
        itemCount: 0
      }
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to get updated cart with items and total
async function getUpdatedCart(cartId) {
  const cartItems = await CartItem.findAll({
    where: { cartId },
    include: [
      { 
        model: Product, 
        as: "product",
        attributes: ["id", "title", "price", "imageUrl"]
      }
    ]
  });
  
  let total = 0;
  cartItems.forEach(item => {
    if (item.product) {
      total += item.product.price * item.quantity;
    }
  });
  
  return {
    id: cartId,
    items: cartItems,
    total,
    itemCount: cartItems.length
  };
}
