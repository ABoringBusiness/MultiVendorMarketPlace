'use strict';

const { Category } = require('../../models');

/**
 * Create a new category.
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    res.status(201).json({ category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a list of all categories.
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a single category by its ID.
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing category.
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    
    const { name, description } = req.body;
    category.name = name || category.name;
    category.description = description || category.description;
    await category.save();
    
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a category.
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    
    await category.destroy();
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
