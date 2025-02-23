import { ReviewModel } from "../models/supabase/reviewModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ROLES } from "../constants/roles.js";
import { supabase } from "../database/connection.js";

// Get seller reviews
export const getSellerReviews = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  // Verify seller exists
  const { data: targetSeller, error: findSellerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (findSellerError || !targetSeller) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  if (targetSeller.role.toUpperCase() !== ROLES.SELLER.toUpperCase()) {
    return next(new ErrorHandler("User is not a seller.", 400));
  }

  const reviews = await ReviewModel.findBySeller(id);
  const averageRating = await ReviewModel.getSellerRating(id);

  res.status(200).json({
    success: true,
    reviews,
    average_rating: averageRating
  });
});

// Create a review
export const createReview = catchAsyncErrors(async (req, res, next) => {
  const { id: sellerId } = req.params;
  const { rating, comment } = req.body;

  try {
    // Check authentication first (401)
    if (!req.user || !req.user.role) {
      return next(new ErrorHandler("Authentication required.", 401));
    }

    // Check if user is a seller trying to review (400) - business rule check must come first
    if (req.user.role.toUpperCase() === ROLES.SELLER.toUpperCase()) {
      return next(new ErrorHandler("You cannot review yourself.", 400));
    }

    // Check if seller exists and is valid (404)
    const { data: targetSeller, error: findSellerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (findSellerError || !targetSeller) {
      return next(new ErrorHandler("Seller not found.", 404));
    }

    if (targetSeller.role.toUpperCase() !== ROLES.SELLER.toUpperCase()) {
      return next(new ErrorHandler("User is not a seller.", 404));
    }

    // Check if user is a buyer (403) - role check comes after business rules
    if (req.user.role.toUpperCase() !== ROLES.BUYER.toUpperCase()) {
      return next(new ErrorHandler("Only buyers can leave reviews.", 403));
    }

    // Validate rating
    if (!rating) {
      return next(new ErrorHandler("Rating is required.", 400));
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return next(new ErrorHandler("Rating must be between 1 and 5.", 400));
    }

    // Check if user has already reviewed this seller
    const { data: hasReview, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('reviewer_id', req.user.id)
      .single();

    if (hasReview) {
      return next(new ErrorHandler("You have already reviewed this seller.", 400));
    }

    try {
      // Create the review
      const { data: review, error: insertError } = await supabase
        .from('reviews')
        .insert({
          seller_id: sellerId,
          reviewer_id: req.user.id,
          rating: ratingNum,
          comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating review:', insertError);
        return next(new ErrorHandler("Failed to create review", 500));
      }

      res.status(201).json({
        success: true,
        message: "Review added successfully.",
        review
      });
    } catch (error) {
      console.error('Error in review creation:', error);
      return next(new ErrorHandler("Failed to create review", 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message || "Failed to create review", 500));
  }
});

// Delete a review (Buyer who created it or Admin)
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Check authentication first (401)
  if (!req.user || !req.user.role) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  const { data: review, error: findError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !review) {
    return next(new ErrorHandler("Review not found.", 404));
  }

  // Check if user is the reviewer or an admin
  if (review.reviewer_id !== req.user.id && req.user.role.toUpperCase() !== ROLES.ADMIN.toUpperCase()) {
    return next(new ErrorHandler("Not authorized to delete this review.", 403));
  }

  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting review:', deleteError);
    return next(new ErrorHandler("Failed to delete review", 500));
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully."
  });
});
