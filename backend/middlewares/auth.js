import { supabase } from '../database/connection.js';
import { ROLES, ROLE_MAPPINGS } from '../constants/roles.js';
import ErrorHandler from "./error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ErrorHandler("No token provided.", 401));
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return next(new ErrorHandler("Invalid or expired token.", 401));
    }

    // Get user data from our users table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !dbUser) {
      return next(new ErrorHandler("User not found.", 404));
    }

    req.user = dbUser;
    next();
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const legacyRole = req.user.legacy_role;
    
    // Check if user has any of the required roles (new or legacy)
    const hasPermission = roles.some(role => 
      role === userRole || 
      role === legacyRole || 
      (legacyRole && role === ROLE_MAPPINGS[legacyRole])
    );

    if (!hasPermission) {
      return next(
        new ErrorHandler(
          `${userRole} not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};
