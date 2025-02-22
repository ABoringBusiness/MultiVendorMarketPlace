import { supabase } from '../../database/connection.js';

export const ReportModel = {
  // Create a new report
  async create(reportData) {
    const { data, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find report by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find pending reports
  async findPending() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update report status
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
