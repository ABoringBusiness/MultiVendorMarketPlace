/**
 * Hybrid Product Controller
 *
 * Uses Convex when available, falls back to PostgreSQL.
 * Drop-in replacement for productController.js
 */

const { Product, Category, User } = require("../models");
const { Op } = require("sequelize");
const convexService = require("../services/convexService");

// Helper: Check if Convex is available
const useConvex = () => convexService.isConvexEnabled();

// @desc Create a new product
// @route POST /api/products
exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can create products" });
    }

    const { title, description, price, imageUrl, categoryId } = req.body;

    if (useConvex()) {
      // Use Convex
      const result = await convexService.createProduct(req.user.sessionToken, {
        title,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId,
      });
      return res.status(201).json({ message: "Product created successfully", product: result });
    }

    // Fallback to PostgreSQL
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const product = await Product.create({
      sellerId: req.user.id,
      categoryId,
      title,
      description,
      price,
      imageUrl,
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all products
// @route GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const { categoryId, sellerId, minPrice, maxPrice, search } = req.query;

    if (useConvex()) {
      // Use Convex
      const products = await convexService.getProducts({
        categoryId,
        sellerId,
        includeDisabled: false,
      });

      // Apply additional filters (Convex doesn't have all filters yet)
      let filtered = products || [];
      if (minPrice) filtered = filtered.filter((p) => p.price >= parseFloat(minPrice));
      if (maxPrice) filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice));
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title?.toLowerCase().includes(s) ||
            p.description?.toLowerCase().includes(s)
        );
      }

      return res.json(filtered);
    }

    // Fallback to PostgreSQL
    const whereCondition = { isDisabled: false };
    if (categoryId) whereCondition.categoryId = categoryId;
    if (sellerId) whereCondition.sellerId = sellerId;
    if (minPrice) whereCondition.price = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) {
      whereCondition.price = { ...whereCondition.price, [Op.lte]: parseFloat(maxPrice) };
    }
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const products = await Product.findAll({
      where: whereCondition,
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, attributes: ["id", "name"] },
      ],
    });

    res.json(products);
  } catch (error) {
    console.error("getAllProducts error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get a single product by ID
// @route GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    if (useConvex()) {
      const product = await convexService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.json(product);
    }

    // Fallback to PostgreSQL
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: User, attributes: ["id", "name"] },
      ],
    });

    if (!product || product.isDisabled) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update a product
// @route PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, price, imageUrl, categoryId } = req.body;

    if (useConvex()) {
      const result = await convexService.updateProduct(
        req.user.sessionToken,
        req.params.id,
        { title, description, price: price ? parseFloat(price) : undefined, imageUrl, categoryId }
      );
      return res.json({ message: "Product updated successfully", product: result });
    }

    // Fallback to PostgreSQL
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this product" });
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      product.categoryId = categoryId;
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.imageUrl = imageUrl || product.imageUrl;

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete a product
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    if (useConvex()) {
      await convexService.deleteProduct(req.user.sessionToken, req.params.id);
      return res.json({ message: "Product deleted successfully" });
    }

    // Fallback to PostgreSQL
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this product" });
    }

    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Toggle product status
// @route POST /api/products/:id/toggle-status
exports.toggleProductStatus = async (req, res) => {
  try {
    // Use PostgreSQL for now (toggle is complex)
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.user.role === "seller") {
      if (product.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this product" });
      }
      product.isDisabled = true;
    } else if (req.user.role === "admin") {
      product.isDisabled = !product.isDisabled;
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    await product.save();

    res.json({
      message: `Product has been ${product.isDisabled ? "disabled" : "enabled"} successfully.`,
      isDisabled: product.isDisabled,
    });
  } catch (error) {
    console.error("toggleProductStatus error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
