import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Profile Image Required.", 400));
  }

  const { profileImage } = req.files;

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(profileImage.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  const {
    userName,
    email,
    password,
    phone,
    address,
    role,
    bankAccountNumber,
    bankAccountName,
    bankName,
    easypaisaAccountNumber,
    paypalEmail,
  } = req.body;

  if (!userName || !email || !phone || !password || !address || !role) {
    return next(new ErrorHandler("Please fill full form.", 400));
  }
  if (role === "Auctioneer") {
    if (!bankAccountName || !bankAccountNumber || !bankName) {
      return next(
        new ErrorHandler("Please provide your full bank details.", 400)
      );
    }
    if (!easypaisaAccountNumber) {
      return next(
        new ErrorHandler("Please provide your easypaisa account number.", 400)
      );
    }
    if (!paypalEmail) {
      return next(new ErrorHandler("Please provide your paypal email.", 400));
    }
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("User already registered.", 400));
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    profileImage.tempFilePath,
    {
      folder: "MERN_AUCTION_PLATFORM_USERS",
    }
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary error:",
      cloudinaryResponse.error || "Unknown cloudinary error."
    );
    return next(
      new ErrorHandler("Failed to upload profile image to cloudinary.", 500)
    );
  }
  const user = await User.create({
    userName,
    email,
    password,
    phone,
    address,
    role,
    profileImage: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    paymentMethods: {
      bankTransfer: {
        bankAccountNumber,
        bankAccountName,
        bankName,
      },
      easypaisa: {
        easypaisaAccountNumber,
      },
      paypal: {
        paypalEmail,
      },
    },
  });
  generateToken(user, "User Registered.", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please fill full form."));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid credentials.", 400));
  }
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid credentials.", 400));
  }
  generateToken(user, "Login successfully.", 200, res);
});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logout Successfully.",
    });
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ moneySpent: { $gt: 0 } });
  const leaderboard = users.sort((a, b) => b.moneySpent - a.moneySpent);
  res.status(200).json({
    success: true,
    leaderboard,
  });
});

export const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please provide both old and new passwords.", 400));
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect old password.", 400));
  }

  user.password = newPassword; 
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Password changed successfully." });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      userName,
      email,
      phone,
      address,
      paymentMethods: { bankTransfer, easypaisa, paypal } = {},
    } = req.body;

    const updateFields = {};

    if (userName) updateFields.userName = userName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;

    if (bankTransfer || easypaisa || paypal) {
      updateFields.paymentMethods = {};

      if (bankTransfer) {
        updateFields.paymentMethods.bankTransfer = {
          bankAccountNumber: bankTransfer.bankAccountNumber,
          bankAccountName: bankTransfer.bankAccountName,
          bankName: bankTransfer.bankName,
        };
      }

      if (easypaisa) {
        updateFields.paymentMethods.easypaisa = {
          easypaisaAccountNumber: easypaisa.easypaisaAccountNumber,
        };
      }

      if (paypal) {
        updateFields.paymentMethods.paypal = {
          paypalEmail: paypal.paypalEmail,
        };
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Failed to update profile.", 500));
  }
});

//
export const deleteAccount = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder" && user.role !== "Auctioneer") {
      return next(new ErrorHandler("Only bidders and auctioneers can delete their account.", 403));
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Server error, could not delete account.", 500));
  }
});


export const getSellerProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    const seller = await User.findById(id).select('userName profileImage createdAt role auctionsWon moneySpent email phone address');
    
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    const auctions = await Auction.find({ createdBy: id }).select('title startingBid currentBid endTime image');

    res.status(200).json({
      success: true,
      seller,
      auctions,
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Server error", 500));
  }
});

export const addToWishlist = catchAsyncErrors(async (req, res, next) => {
  const { userId, auctionId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder") {
      return next(new ErrorHandler("Only bidders can have a wishlist.", 403));
    }

    if (user.wishlist.includes(auctionId)) {
      return next(new ErrorHandler("Auction already in wishlist.", 409));
    }

    user.wishlist.push(auctionId);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Auction added to wishlist.",
    });
  } catch (error) {
    return next(new ErrorHandler("Server error", 500));
  }
});

export const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
  const { userId, auctionId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder") {
      return next(new ErrorHandler("Only bidders can have a wishlist.", 403));
    }

    user.wishlist = user.wishlist.filter((id) => id.toString() !== auctionId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Auction removed from wishlist.",
    });
  } catch (error) {
    return next(new ErrorHandler("Server error", 500));
  }
});

export const getWishlist = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate("wishlist");
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder") {
      return next(new ErrorHandler("Only bidders can have a wishlist.", 403));
    }

    res.status(200).json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    return next(new ErrorHandler("Server error", 500));
  }
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;  

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5173/password/reset/${resetToken}`;
    const message = `Click the following link to reset your password: \n\n${resetUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler('Email could not be sent', 500));
  }
});


export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetToken = req.params.token;

  // Hash the token and find the user
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler('Invalid or expired reset token', 400));
  }

  // Set the new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});
