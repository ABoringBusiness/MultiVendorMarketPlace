import { supabase } from '../database/connection.js';

export const searchProducts = async (req, res) => {
  try {
    const { q, category, min_price, max_price } = req.query;
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    // Apply search filter
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply price range filter
    if (min_price !== undefined) {
      query = query.gte('price', parseFloat(min_price));
    }
    if (max_price !== undefined) {
      query = query.lte('price', parseFloat(max_price));
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error searching products:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching products',
        error: error.message
      });
    }

    // Ensure we always return an array
    return res.status(200).json({
      success: true,
      products: products || []
    });
  } catch (error) {
    console.error('Error in search controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
