import { supabase } from '../database/connection.js';
import { ROLES } from '../constants/roles.js';

export const listProducts = async (req, res) => {
  try {
    // Build query
    const query = supabase
      .from('products')
      .select('*');

    // Add status filter
    query.eq('status', 'active');

    // Execute query
    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching products',
        error: error.message
      });
    }

    // Ensure we have an array even if data is null
    const productList = Array.isArray(products) ? products : [];
    
    // Log for debugging
    console.log('Query executed:', query);
    console.log('Products fetched:', productList);

    return res.status(200).json({
      success: true,
      products: productList
    });
  } catch (error) {
    console.error('Error in listProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Build query
    const query = supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    // Execute query
    const { data: product, error } = await query;

    // Log for debugging
    console.log('Query executed:', query);
    console.log('Product fetched:', product);

    if (error || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error in getProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    // Check if user is a seller
    if (req.user.role !== ROLES.SELLER) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create products'
      });
    }

    const { title, description, price, category_id } = req.body;
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        title,
        description,
        price,
        category_id,
        seller_id: req.user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists and user owns it
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is active
    if (product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.seller_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const { title, description, price } = req.body;
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({ title, description, price })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const disableProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is an admin
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can disable products'
      });
    }

    // Check if product exists
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (fetchError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { data: disabledProduct, error } = await supabase
      .from('products')
      .update({ status: 'disabled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error disabling product:', error);
      return res.status(500).json({
        success: false,
        message: 'Error disabling product',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      product: disabledProduct
    });
  } catch (error) {
    console.error('Error in disableProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
