import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { CategorySuggestionModel } from "../models/supabase/categorySuggestionModel.js";
import { UserModel } from "../models/supabase/userModel.js";

export const suggestCategory = catchAsyncErrors(async (req, res, next) => {
  const { suggestedCategory } = req.body;
  const userId = req.user.id;

  if (!suggestedCategory) {
    return next(new ErrorHandler("Category name is required.", 400));
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (user.role !== "Auctioneer") {
    return next(new ErrorHandler("Only auctioneers are allowed to suggest categories.", 403));
  }

  const newSuggestion = await CategorySuggestionModel.create({
    suggested_category: suggestedCategory,
    suggested_by: userId,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: "Category suggestion submitted successfully.",
    suggestion: newSuggestion,
  });
});
