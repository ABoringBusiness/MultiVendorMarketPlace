import { supabase } from '../../database/connection.js';

export const ReviewModel = {
  // Create a new review
  async create(reviewData) {
    // Check if reviewer has already reviewed this seller
    const existing = await this.findByReviewerAndSeller(
      reviewData.reviewer_id,
      reviewData.seller_id
    );

    if (existing) {
      throw new Error('You have already reviewed this seller.');
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Find review by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('reviews')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Find reviews by seller
  async findBySeller(sellerId) {
    const { data, error } = await supabase
      .from('reviews')
      .select()
      .eq('seller_id', sellerId);

    if (error) throw error;
    return data;
  },

  // Find review by reviewer and seller
  async findByReviewerAndSeller(reviewerId, sellerId) {
    const { data, error } = await supabase
      .from('reviews')
      .select()
      .eq('reviewer_id', reviewerId)
      .eq('seller_id', sellerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
    return data;
  },

  // Delete review
  async delete(id) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Get seller average rating
  async getSellerRating(sellerId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId);

    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  }
};
