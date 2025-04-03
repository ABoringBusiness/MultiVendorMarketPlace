const { Product, Category, User } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// @desc Search for products with filters
// @route GET /api/search
exports.searchProducts = async (req, res) => {
  try {
    const { query, categoryId, minPrice, maxPrice, sort } = req.query;
    
    // Build the where condition
    const whereCondition = { isDisabled: false };
    
    // Add search query if provided
    if (query) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ];
    }
    
    // Add category filter if provided
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    // Add price range filters if provided
    if (minPrice || maxPrice) {
      whereCondition.price = {};
      
      if (minPrice) {
        whereCondition.price[Op.gte] = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        whereCondition.price[Op.lte] = parseFloat(maxPrice);
      }
    }
    
    // Build the order condition
    let orderCondition = [];
    if (sort) {
      switch (sort) {
        case 'price_asc':
          orderCondition.push(['price', 'ASC']);
          break;
        case 'price_desc':
          orderCondition.push(['price', 'DESC']);
          break;
        case 'newest':
          orderCondition.push(['createdAt', 'DESC']);
          break;
        case 'oldest':
          orderCondition.push(['createdAt', 'ASC']);
          break;
        default:
          orderCondition.push(['createdAt', 'DESC']);
      }
    } else {
      orderCondition.push(['createdAt', 'DESC']);
    }
    
    // Execute the query
    const products = await Product.findAll({
      where: whereCondition,
      include: [
        { model: Category, attributes: ["id", "name"] }, 
        { model: User, attributes: ["id", "name"] }
      ],
      order: orderCondition
    });
    
    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get product suggestions based on search query
// @route GET /api/search/suggestions
exports.getProductSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const suggestions = await Product.findAll({
      attributes: ['id', 'title'],
      where: {
        isDisabled: false,
        title: { [Op.iLike]: `%${query}%` }
      },
      limit: 5,
      order: [['title', 'ASC']]
    });
    
    res.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};