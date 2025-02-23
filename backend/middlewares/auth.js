import { supabase } from '../database/connection.js';

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For test environment, use mock tokens
    if (process.env.NODE_ENV === 'test') {
      const mockUsers = {
        'mock-seller-token': {
          id: 'seller-id',
          role: 'seller',
          email: 'seller@test.com'
        },
        'mock-admin-token': {
          id: 'admin-id',
          role: 'admin',
          email: 'admin@test.com'
        }
      };

      const mockUser = mockUsers[token];
      if (!mockUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      req.user = mockUser;
      return next();
    }

    // For production, use Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = userData;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
