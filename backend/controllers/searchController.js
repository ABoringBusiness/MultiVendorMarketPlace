import { supabase } from '../database/connection.js';

export const searchProducts = async (req, res) => {
  try {
    const { q, category, min_price, max_price } = req.query;
    
    // Start with base query
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply price range filter
    if (min_price !== undefined && min_price !== '') {
      query = query.gte('price', parseFloat(min_price));
    }
    if (max_price !== undefined && max_price !== '') {
      query = query.lte('price', parseFloat(max_price));
    }

    // Apply search filter using ILIKE for case-insensitive search
    if (q) {
      const searchTerm = `%${q}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Execute query and handle response
    const { data: products, error } = await query;

    if (error) {
      console.error('Error searching products:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching products',
        error: error.message
      });
    }

    // Filter results in memory to ensure all conditions are met
    let filteredProducts = products || [];

    // Apply category filter in memory
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category_id === category);
    }

    // Apply price range filter in memory
    if (min_price !== undefined && min_price !== '') {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(min_price));
    }
    if (max_price !== undefined && max_price !== '') {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(max_price));
    }

    // Apply text search filter in memory
    if (q) {
      const searchLower = q.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json({
      success: true,
      products: filteredProducts
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
