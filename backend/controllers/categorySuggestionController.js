import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { CategorySuggestion } from "../models/categorySuggestion.js";
import { User } from "../models/userSchema.js";

export const suggestCategory = catchAsyncErrors(async (req, res, next) => {
  const { suggestedCategory } = req.body;
  const userId = req.user._id;

  if (!suggestedCategory) {
    return next(new ErrorHandler("Category name is required.", 400));
  }

  const user = await User.findById(userId);

  if (!user || user.role !== "Auctioneer") {
    return next(new ErrorHandler("Only auctioneers are allowed to suggest categories.", 403));
  }

  const newSuggestion = await CategorySuggestion.create({
    suggestedCategory,
    suggestedBy: userId,
  });

  res.status(201).json({
    success: true,
    message: "Category suggestion submitted successfully.",
    suggestion: newSuggestion,
  });
});
