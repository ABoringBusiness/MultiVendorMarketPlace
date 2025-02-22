import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { UserModel } from "../models/supabase/userModel.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";
import axios from "axios";
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
  const isRegistered = await UserModel.findByEmail(email);
  if (isRegistered) {
    return next(new ErrorHandler("User already registered.", 400));
  }

  // Upload image to TwicPics
  const formData = new FormData();
  formData.append('image', profileImage.buffer);
  
  const twicResponse = await axios.post('https://styley.twicpics.com/v1/upload', formData, {
    headers: {
      'Authorization': `Bearer ${process.env.TWICPICS_TOKEN}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  if (!twicResponse.data || twicResponse.data.error) {
    console.error(
      "TwicPics error:",
      twicResponse.data.error || "Unknown TwicPics error."
    );
    return next(
      new ErrorHandler("Failed to upload profile image.", 500)
    );
  }

  const user = await UserModel.create({
    user_name: userName,
    email,
    password,
    phone,
    address,
    role,
    profile_image: {
      path: twicResponse.data.path,
      url: `${process.env.TWICPICS_DOMAIN}/${twicResponse.data.path}`
    },
    payment_methods: {
      bank_transfer: {
        account_number: bankAccountNumber,
        account_name: bankAccountName,
        bank_name: bankName,
      },
      easypaisa: {
        account_number: easypaisaAccountNumber,
      },
      paypal: {
        email: paypalEmail,
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
  const user = await UserModel.findByEmail(email);
  if (!user) {
    return next(new ErrorHandler("Invalid credentials.", 400));
  }
  
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid credentials.", 400));
  }
  
  generateToken(user, "Login successfully.", 200, res);
});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    .json({
      success: true,
      message: "Logout Successfully.",
    });
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
  const users = await UserModel.findByMoneySpent();
  const leaderboard = users.sort((a, b) => b.money_spent - a.money_spent);
  
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

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect old password.", 400));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserModel.update(user.id, { password: hashedPassword });

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

    if (userName) updateFields.user_name = userName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;

    if (bankTransfer || easypaisa || paypal) {
      updateFields.payment_methods = {};

      if (bankTransfer) {
        updateFields.payment_methods.bank_transfer = {
          account_number: bankTransfer.bankAccountNumber,
          account_name: bankTransfer.bankAccountName,
          bank_name: bankTransfer.bankName,
        };
      }

      if (easypaisa) {
        updateFields.payment_methods.easypaisa = {
          account_number: easypaisa.easypaisaAccountNumber,
        };
      }

      if (paypal) {
        updateFields.payment_methods.paypal = {
          email: paypal.paypalEmail,
        };
      }
    }

    const updatedUser = await UserModel.update(userId, updateFields);

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

    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder" && user.role !== "Auctioneer") {
      return next(new ErrorHandler("Only bidders and auctioneers can delete their account.", 403));
    }

    await UserModel.delete(userId);

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

    const seller = await UserModel.findById(id, [
      'user_name',
      'profile_image',
      'created_at',
      'role',
      'auctions_won',
      'money_spent',
      'email',
      'phone',
      'address'
    ]);
    
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    const auctions = await AuctionModel.findByCreator(id, [
      'title',
      'starting_bid',
      'current_bid',
      'end_time',
      'image'
    ]);

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
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder") {
      return next(new ErrorHandler("Only bidders can have a wishlist.", 403));
    }

    const wishlist = user.wishlist || [];
    if (wishlist.includes(auctionId)) {
      return next(new ErrorHandler("Auction already in wishlist.", 409));
    }

    wishlist.push(auctionId);
    await UserModel.update(userId, { wishlist });

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
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder") {
      return next(new ErrorHandler("Only bidders can have a wishlist.", 403));
    }

    const wishlist = (user.wishlist || []).filter(id => id !== auctionId);
    await UserModel.update(userId, { wishlist });

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
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    if (user.role !== "Bidder") {
      return next(new ErrorHandler("Only bidders can have a wishlist.", 403));
    }

    const wishlist = await Promise.all(
      (user.wishlist || []).map(id => AuctionModel.findById(id))
    );

    res.status(200).json({
      success: true,
      wishlist: wishlist.filter(Boolean), // Remove any null values from deleted auctions
    });
  } catch (error) {
    return next(new ErrorHandler("Server error", 500));
  }
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000);

    await UserModel.update(user.id, {
      reset_password_token: hashedToken,
      reset_password_expires: resetExpires
    });

    const resetUrl = `http://localhost:5173/password/reset/${resetToken}`;
    const message = `Click the following link to reset your password: \n\n${resetUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    if (user) {
      await UserModel.update(user.id, {
        reset_password_token: null,
        reset_password_expires: null
      });
    }

    return next(new ErrorHandler('Email could not be sent', 500));
  }
});


export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetToken = req.params.token;
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await UserModel.findByResetToken(hashedToken);
  if (!user || !user.reset_password_expires || new Date(user.reset_password_expires) < new Date()) {
    return next(new ErrorHandler('Invalid or expired reset token', 400));
  }

  // Hash the new password and update user
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await UserModel.update(user.id, {
    password: hashedPassword,
    reset_password_token: null,
    reset_password_expires: null
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});
