import { Router } from 'express';
import { supabase } from '../database/connection.js';
import { UserModel } from '../models/supabase/userModel.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

// Register user
router.post('/register', catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorHandler("Profile Image Required.", 400));
    }

    const { profileImage } = req.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(profileImage.mimetype)) {
      return next(new ErrorHandler("File format not supported.", 400));
    }

    const user = await UserModel.create(req.body);
    
    // Set session cookie
    const { data: sessionData } = await supabase.auth.setSession({
      access_token: user.access_token,
      refresh_token: user.refresh_token
    });

    res.status(201).json({
      success: true,
      message: "User Registered.",
      user
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

// Login user
router.post('/login', catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please fill full form."));
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (authError) throw authError;

    // Get user data from our database
    const user = await UserModel.findById(authData.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    res.status(200).json({
      success: true,
      message: "Login successfully.",
      user
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

// Get user profile
router.get('/profile', isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

// Logout user
router.post('/logout', catchAsyncErrors(async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Logout Successfully."
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

// Update profile
router.put('/update-profile', isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const updatedUser = await UserModel.update(req.user.id, req.body);
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

export default router;
