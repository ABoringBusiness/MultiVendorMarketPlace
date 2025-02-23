import { Router } from 'express';
import { supabase } from '../database/connection.js';
import { UserModel } from '../models/supabase/userModel.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { ROLES, ROLE_MAPPINGS } from '../constants/roles.js';

const router = Router();

// Register user
router.post('/register', catchAsyncErrors(async (req, res, next) => {
  try {
    // Profile image validation temporarily disabled for testing
    // if (!req.files || Object.keys(req.files).length === 0) {
    //   return next(new ErrorHandler("Profile Image Required.", 400));
    // }

    // const { profileImage } = req.files;
    // const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    // if (!allowedFormats.includes(profileImage.mimetype)) {
    //   return next(new ErrorHandler("File format not supported.", 400));
    // }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: req.body.email,
      password: req.body.password,
      options: {
        data: {
          role: ROLE_MAPPINGS[req.body.role] || req.body.role
        },
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });
    if (authError) throw authError;

    if (!authData?.user) throw new Error("Failed to create user");

    // Create user in our database
    const user = await UserModel.create({
      id: authData.user.id,
      ...req.body,
      legacy_role: req.body.role,
      role: ROLE_MAPPINGS[req.body.role] || req.body.role
    });
    
    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to confirm your account.",
      user,
      token: authData.session?.access_token,
      confirmEmail: true
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

    try {
      // Sign in with Supabase Auth
      const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          return next(new ErrorHandler("Please confirm your email before logging in.", 401));
        }
        throw authError;
      }

      if (!user) {
        return next(new ErrorHandler("Invalid credentials.", 401));
      }

      // Get user data from our database
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      res.status(200).json({
        success: true,
        message: "Login successful.",
        user: dbUser,
        token: session.access_token
      });
    } catch (error) {
      if (error.message.includes('rate limit')) {
        return next(new ErrorHandler("Too many login attempts. Please try again later.", 429));
      }
      throw error;
    }
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
