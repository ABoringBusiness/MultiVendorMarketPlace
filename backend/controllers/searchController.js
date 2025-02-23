import { ProductModel } from '../models/supabase/productModel.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';

// Search products
export const searchProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const { query = '', category_id, min_price, max_price } = req.query;
    
    // Validate price range if provided
    if (min_price && max_price && parseFloat(min_price) > parseFloat(max_price)) {
      return next(new ErrorHandler("Minimum price cannot be greater than maximum price.", 400));
    }

    let products;
    if (query.trim()) {
      // Search by query with filters
      products = await ProductModel.search(query, {
        category_id,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        status: 'active'
      });
    } else {
      // Just apply filters
      products = await ProductModel.findAll({
        category_id,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        status: 'active'
      });
    }

    res.status(200).json({
      success: true,
      products: products || [],
      filters: {
        query,
        category_id,
        min_price,
        max_price
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || "Failed to search products", 500));
  }
});

// Get products by category
export const getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = await ProductModel.findAll({
      category_id: id,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || "Failed to get products by category", 500));
  }
});

// Get products by price range
export const getProductsByPriceRange = catchAsyncErrors(async (req, res, next) => {
  try {
    const { min_price, max_price } = req.query;

    if (!min_price || !max_price) {
      return next(new ErrorHandler("Both minimum and maximum prices are required.", 400));
    }

    if (parseFloat(min_price) > parseFloat(max_price)) {
      return next(new ErrorHandler("Minimum price cannot be greater than maximum price.", 400));
    }

    const products = await ProductModel.findAll({
      min_price: parseFloat(min_price),
      max_price: parseFloat(max_price),
      status: 'active'
    });

    res.status(200).json({
      success: true,
      products,
      price_range: {
        min_price: parseFloat(min_price),
        max_price: parseFloat(max_price)
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || "Failed to get products by price range", 500));
  }
});
