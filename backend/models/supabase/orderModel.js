import { supabase } from '../../database/connection.js';

export const OrderModel = {
  // Create a new order
  async create(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Find order by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Find orders by buyer
  async findByBuyer(buyerId, options = {}) {
    let query = supabase
      .from('orders')
      .select()
      .eq('buyer_id', buyerId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Find orders by seller
  async findBySeller(sellerId, options = {}) {
    let query = supabase
      .from('orders')
      .select()
      .eq('seller_id', sellerId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update order
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('orders')
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

  // Update order status
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
