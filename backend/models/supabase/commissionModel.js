import { supabase } from '../../database/connection.js';

export const CommissionModel = {
  // Create a new commission
  async create(commissionData) {
    const { data, error } = await supabase
      .from('commissions')
      .insert([commissionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find commission by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('commissions')
      .select(`
        *,
        client:users!client_id(*),
        artist:users!artist_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find open commissions
  async findOpen() {
    const { data, error } = await supabase
      .from('commissions')
      .select(`
        *,
        client:users!client_id(*)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update commission
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('commissions')
      .update({ ...updateData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete commission
  async delete(id) {
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
