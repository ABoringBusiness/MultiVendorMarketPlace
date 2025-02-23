import { ReviewModel } from "../models/supabase/reviewModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ROLES } from "../constants/roles.js";

// Get seller reviews
export const getSellerReviews = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  // Verify seller exists
  const seller = await UserModel.findById(id);
  if (!seller) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  if (seller.role !== ROLES.SELLER) {
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

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return next(new ErrorHandler("Rating must be between 1 and 5.", 400));
  }

  // Verify seller exists
  const seller = await UserModel.findById(sellerId);
  if (!seller) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  if (seller.role !== ROLES.SELLER) {
    return next(new ErrorHandler("User is not a seller.", 400));
  }

  // Prevent self-review
  if (sellerId === req.user.id) {
    return next(new ErrorHandler("You cannot review yourself.", 400));
  }

  try {
    const review = await ReviewModel.create({
      seller_id: sellerId,
      reviewer_id: req.user.id,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
      review
    });
  } catch (error) {
    if (error.message.includes('already reviewed')) {
      return next(new ErrorHandler("You have already reviewed this seller.", 400));
    }
    throw error;
  }
});

// Delete a review (Buyer who created it or Admin)
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const review = await ReviewModel.findById(id);

  if (!review) {
    return next(new ErrorHandler("Review not found.", 404));
  }

  // Check if user is the reviewer or an admin
  if (review.reviewer_id !== req.user.id && req.user.role !== ROLES.ADMIN) {
    return next(new ErrorHandler("Not authorized to delete this review.", 403));
  }

  await ReviewModel.delete(id);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully."
  });
});
