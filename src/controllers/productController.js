const { Product } = require("../models");

// @desc Create a new product
// @route POST /api/products
exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can create products" });
    }

    const { title, description, price, imageUrl } = req.body;
    const product = await Product.create({
      sellerId: req.user.id,
      title,
      description,
      price,
      imageUrl,
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Get all products
// @route GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({ where: { isDisabled: false } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Get a single product by ID
// @route GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product || product.isDisabled) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Update a product (only seller can update)
// @route PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this product" });
    }

    const { title, description, price, imageUrl } = req.body;
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.imageUrl = imageUrl || product.imageUrl;

    await product.save();

    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc Delete a product (only seller can delete)
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
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
    res.status(500).json({ message: "Server error", error });
  }
};
