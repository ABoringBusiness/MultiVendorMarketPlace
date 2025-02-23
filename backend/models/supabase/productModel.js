import { supabase } from '../../database/connection.js';
import axios from 'axios';

export const ProductModel = {
  // Create a new product
  async create(productData) {
    // Upload images to TwicPics if provided
    let images = [];
    if (productData.images && productData.images.length > 0) {
      const uploadPromises = productData.images.map(async (image) => {
        const formData = new FormData();
        formData.append('image', image.buffer);
        
        const twicResponse = await axios.post('https://styley.twicpics.com/v1/upload', formData, {
          headers: {
            'Authorization': `Bearer ${process.env.TWICPICS_TOKEN}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (!twicResponse.data || twicResponse.data.error) {
          throw new Error("Failed to upload product image to TwicPics.");
        }

        return {
          path: twicResponse.data.path,
          url: `${process.env.TWICPICS_DOMAIN}/${twicResponse.data.path}`
        };
      });

      images = await Promise.all(uploadPromises);
    }

    // Create product record
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        images: images.map(img => img.url),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Find product by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Find all products
  async findAll(options = {}) {
    let query = supabase
      .from('products')
      .select();

    // Apply filters if provided
    if (options.category_id) {
      query = query.eq('category_id', options.category_id);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.min_price) {
      query = query.gte('price', options.min_price);
    }
    if (options.max_price) {
      query = query.lte('price', options.max_price);
    }
    if (options.seller_id) {
      query = query.eq('seller_id', options.seller_id);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update product
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete product
  async delete(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Search products
  async search(query, options = {}) {
    let dbQuery = supabase
      .from('products')
      .select()
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    // Apply filters
    if (options.category_id) {
      dbQuery = dbQuery.eq('category_id', options.category_id);
    }
    if (options.min_price) {
      dbQuery = dbQuery.gte('price', options.min_price);
    }
    if (options.max_price) {
      dbQuery = dbQuery.lte('price', options.max_price);
    }
    if (options.status) {
      dbQuery = dbQuery.eq('status', options.status);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data;
  }
};
