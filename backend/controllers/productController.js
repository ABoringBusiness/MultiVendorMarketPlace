import { supabase } from '../database/connection.js';
import { ROLES } from '../constants/roles.js';

export const listProducts = async (req, res) => {
  try {
    console.log('Listing products...');
    
    // Build and execute query
    const query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');
    
    console.log('Executing query:', query);
    const { data: products, error } = await query;
    console.log('Query result:', { products, error });

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
    console.log('Getting product:', id);
    
    // Build and execute query
    const query = supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    
    console.log('Executing query:', query);
    const { data: product, error } = await query;
    console.log('Query result:', { product, error });

    // Log for debugging
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
    console.log('Creating product with user:', req.user);
    
    // Check if user is a seller
    if (req.user.role !== ROLES.SELLER) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create products'
      });
    }

    const { title, description, price, category_id } = req.body;
    console.log('Product data:', { title, description, price, category_id });
    
    // Build and execute query
    const query = supabase
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
    
    console.log('Executing query:', query);
    const { data: product, error } = await query;
    console.log('Query result:', { product, error });

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
    console.log('Updating product:', id);
    
    // Check if product exists and user owns it
    const findQuery = supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('Executing find query:', findQuery);
    const { data: product, error: fetchError } = await findQuery;
    console.log('Find query result:', { product, fetchError });

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
    console.log('Update data:', { title, description, price });
    
    // Build and execute update query
    const updateQuery = supabase
      .from('products')
      .update({ title, description, price })
      .eq('id', id)
      .select()
      .single();
    
    console.log('Executing update query:', updateQuery);
    const { data: updatedProduct, error } = await updateQuery;
    console.log('Update query result:', { updatedProduct, error });

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
    console.log('Disabling product:', id);

    // Check if user is an admin
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can disable products'
      });
    }

    // Check if product exists
    const findQuery = supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    
    console.log('Executing find query:', findQuery);
    const { data: product, error: fetchError } = await findQuery;
    console.log('Find query result:', { product, fetchError });

    if (fetchError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Build and execute disable query
    const disableQuery = supabase
      .from('products')
      .update({ status: 'disabled' })
      .eq('id', id)
      .select()
      .single();
    
    console.log('Executing disable query:', disableQuery);
    const { data: disabledProduct, error } = await disableQuery;
    console.log('Disable query result:', { disabledProduct, error });

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
