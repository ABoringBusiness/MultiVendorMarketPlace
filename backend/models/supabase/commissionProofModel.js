import { supabase } from '../../database/connection.js';

export const CommissionProofModel = {
  // Create a new commission proof
  async create(proofData) {
    const { data, error } = await supabase
      .from('commission_proofs')
      .insert([proofData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find proof by commission ID
  async findByCommissionId(commissionId) {
    const { data, error } = await supabase
      .from('commission_proofs')
      .select()
      .eq('commission_id', commissionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update proof status
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('commission_proofs')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
