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
    const { email, password, role, name } = req.body;
    console.log('Registration request:', { email, role, name });

    // Validate required fields
    if (!email || !password || !role || !name) {
      console.error('Missing required fields:', { email: !!email, password: !!password, role: !!role, name: !!name });
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: email, password, role, name"
      });
    }

    // Validate role
    console.log('Validating role:', role, 'Available roles:', Object.values(ROLES));
    if (!Object.values(ROLES).includes(role)) {
      console.error('Invalid role:', role, 'Available roles:', Object.values(ROLES));
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      console.error('User already exists:', email);
      return next(new ErrorHandler("User already exists", 400));
    }

    console.log('Creating Supabase auth user...');
    // Create Supabase auth user
    console.log('Creating Supabase auth user with:', { email, role: ROLE_MAPPINGS[role] || role, name });
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: ROLE_MAPPINGS[role] || role,
          name
        },
        emailRedirectTo: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/auth/callback` : undefined
      }
    });
    console.log('Supabase auth response:', { authData, authError });

    if (authError) {
      console.error('Auth Error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    if (!authData?.user) {
      console.error('No user data returned from Supabase');
      return res.status(400).json({
        success: false,
        message: "Failed to create user"
      });
    }

    console.log('Creating user in database...');
    // Create user in our database
    let user;
    try {
      user = await UserModel.create({
        id: authData.user.id,
        email: email,
        name: name,
        role: role,
        legacy_role: role,
        status: 'active',
        password: password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!user) {
        console.error('Failed to create user in database - no user returned');
        return res.status(400).json({
          success: false,
          message: "Failed to create user in database"
        });
      }
      console.log('User created successfully:', user.id);

      res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email to confirm your account.",
        user,
        token: authData.session?.access_token,
        confirmEmail: true
      });
    } catch (dbError) {
      console.error('Database Error:', dbError);
      return res.status(400).json({
        success: false,
        message: dbError.message || "Failed to create user in database"
      });
    }
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

      if (authError || !user) {
        if (authError?.message.includes('Email not confirmed')) {
          return next(new ErrorHandler("Please confirm your email before logging in.", 401));
        }
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
