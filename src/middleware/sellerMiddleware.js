const { User } = require("../models");

/**
 * Middleware to check if the user is a seller
 */
const sellerMiddleware = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== "seller") {
      return res.status(403).json({ message: "Access denied. Seller role required." });
    }
    
    next();
  } catch (error) {
    console.error("Seller middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = sellerMiddleware;