'use strict';

const { Product } = require('../../models');

/**
 * Create a new product.
 * (Assumes the vendor’s ID is attached to req.user from authentication middleware)
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, inventory_quantity, category, image_url } = req.body;
    const vendor_id = req.user.id; // Ensure req.user is set (e.g., via an auth middleware)

    const product = await Product.create({
      vendor_id,
      name,
      description,
      price,
      inventory_quantity,
      category,
      image_url,
    });

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a list of all products.
 */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a product by its ID.
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing product.
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Optional: Check if the current user (req.user) is allowed to update this product.
    const { name, description, price, inventory_quantity, category, image_url } = req.body;

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.inventory_quantity = inventory_quantity !== undefined ? inventory_quantity : product.inventory_quantity;
    product.category = category || product.category;
    product.image_url = image_url || product.image_url;

    await product.save();
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a product.
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    
    await product.destroy();
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
