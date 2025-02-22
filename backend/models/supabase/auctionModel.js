import { supabase } from '../../database/connection.js';

export const AuctionModel = {
  // Create a new auction
  async create(auctionData) {
    const { data, error } = await supabase
      .from('auctions')
      .insert([auctionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find auction by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*),
        winner:users!winner_id(*),
        bids(*)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find active auctions
  async findActive() {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:users!seller_id(*)
      `)
      .eq('status', 'active')
      .order('end_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Update auction
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('auctions')
      .update({ ...updateData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete auction
  async delete(id) {
    const { error } = await supabase
      .from('auctions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
