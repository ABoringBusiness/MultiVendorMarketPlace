'use strict';

const { Review } = require('../../models');

/**
 * Create a new review.
 * Assumes req.user.id is set by an authentication middleware.
 */
exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id; // Authenticated user's ID

    const review = await Review.create({ product_id, user_id, rating, comment });
    res.status(201).json({ review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all reviews for a specific product.
 */
exports.getReviewsForProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const reviews = await Review.findAll({ where: { product_id } });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing review.
 * Only the owner (reviewer) can update their review.
 */
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    // Ensure the logged-in user is the owner of the review.
    if (req.user.id !== review.user_id) {
      return res.status(403).json({ message: 'Not authorized to update this review.' });
    }

    const { rating, comment } = req.body;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();
    res.json({ review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a review.
 * Only the owner (reviewer) can delete their review.
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    // Ensure the logged-in user is the owner of the review.
    if (req.user.id !== review.user_id) {
      return res.status(403).json({ message: 'Not authorized to delete this review.' });
    }

    await review.destroy();
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
