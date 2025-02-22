import { supabase } from '../../database/connection.js';

export const BidModel = {
  // Create a new bid
  async create(bidData) {
    const { data, error } = await supabase
      .from('bids')
      .insert([bidData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get bids for an auction
  async findByAuctionId(auctionId) {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        bidder:users!bidder_id(*)
      `)
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get highest bid for an auction
  async findHighestBid(auctionId) {
    const { data, error } = await supabase
      .from('bids')
      .select()
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Delete bid
  async delete(id) {
    const { error } = await supabase
      .from('bids')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
