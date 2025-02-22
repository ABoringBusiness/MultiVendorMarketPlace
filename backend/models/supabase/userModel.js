import { supabase } from '../../database/connection.js';

export const UserModel = {
  // Create a new user
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find user by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find user by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update user
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updateData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete user
  async delete(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
