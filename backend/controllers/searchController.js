import { ProductModel } from "../models/supabase/productModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

// Search products with filters
export const searchProducts = catchAsyncErrors(async (req, res, next) => {
  const { query, category_id, min_price, max_price } = req.query;

  // Validate price range if provided
  if (min_price && max_price && parseFloat(min_price) > parseFloat(max_price)) {
    return next(new ErrorHandler("Minimum price cannot be greater than maximum price.", 400));
  }

  const options = {
    category_id,
    min_price: min_price ? parseFloat(min_price) : undefined,
    max_price: max_price ? parseFloat(max_price) : undefined,
    status: 'active'
  };

  let products;
  if (query) {
    // Search by query with filters
    products = await ProductModel.search(query, options);
  } else {
    // Just apply filters
    products = await ProductModel.findAll(options);
  }

  res.status(200).json({
    success: true,
    products,
    filters: {
      query,
      category_id,
      min_price,
      max_price
    }
  });
});

// Get products by category
export const getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const products = await ProductModel.findAll({
    category_id: id,
    status: 'active'
  });

  res.status(200).json({
    success: true,
    products
  });
});

// Get products by price range
export const getProductsByPriceRange = catchAsyncErrors(async (req, res, next) => {
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
});
