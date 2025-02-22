import { supabase } from '../../database/connection.js';

export const CategorySuggestionModel = {
  // Create a new category suggestion
  async create(suggestionData) {
    const { data, error } = await supabase
      .from('category_suggestions')
      .insert([suggestionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find suggestion by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('category_suggestions')
      .select(`
        *,
        suggested_by:users(*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find pending suggestions
  async findPending() {
    const { data, error } = await supabase
      .from('category_suggestions')
      .select(`
        *,
        suggested_by:users(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update suggestion status
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('category_suggestions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
