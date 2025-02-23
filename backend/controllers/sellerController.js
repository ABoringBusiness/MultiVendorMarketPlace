import { UserModel } from "../models/supabase/userModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ROLES } from "../constants/roles.js";

// Get all sellers
export const getAllSellers = catchAsyncErrors(async (req, res, next) => {
  const sellers = await UserModel.findAll({
    role: ROLES.SELLER
  });

  res.status(200).json({
    success: true,
    sellers: sellers.map(seller => ({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      avatar: seller.avatar,
      created_at: seller.created_at
    }))
  });
});

// Get seller profile
export const getSellerProfile = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const seller = await UserModel.findById(id);

  if (!seller) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  if (seller.role !== ROLES.SELLER) {
    return next(new ErrorHandler("User is not a seller.", 400));
  }

  res.status(200).json({
    success: true,
    seller: {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      avatar: seller.avatar,
      created_at: seller.created_at
    }
  });
});

// Disable seller (Admin only)
export const disableSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const seller = await UserModel.findById(id);

  if (!seller) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  if (seller.role !== ROLES.SELLER) {
    return next(new ErrorHandler("User is not a seller.", 400));
  }

  // Update user status
  const updatedSeller = await UserModel.update(id, {
    status: 'disabled'
  });

  res.status(200).json({
    success: true,
    message: "Seller disabled successfully.",
    seller: {
      id: updatedSeller.id,
      name: updatedSeller.name,
      email: updatedSeller.email,
      status: updatedSeller.status
    }
  });
});
