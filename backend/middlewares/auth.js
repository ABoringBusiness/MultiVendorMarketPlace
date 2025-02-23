import { supabase } from '../database/connection.js';
import { ROLES, ROLE_MAPPINGS } from '../constants/roles.js';
import ErrorHandler from "./error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    // Get session from Supabase Auth
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return next(new ErrorHandler("User not authenticated.", 401));
    }

    // Get user data from our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    req.user = user;
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
