import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

describe('Review API', () => {
  let sellerToken;
  let buyerToken;
  let sellerId;
  let testReview;

  beforeAll(async () => {
    // Create test seller
    const sellerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'seller@test.com',
        password: 'test123',
        name: 'Test Seller',
        role: ROLES.SELLER
      });
    sellerToken = sellerRes.body.token;
    sellerId = sellerRes.body.user.id;

    // Create test buyer
    const buyerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'buyer@test.com',
        password: 'test123',
        name: 'Test Buyer',
        role: ROLES.BUYER
      });
    buyerToken = buyerRes.body.token;
  });

  beforeEach(async () => {
    // Clear test data
    await supabase.from('reviews').delete().neq('id', '0');
  });

  describe('POST /reviews/sellers/:id/create', () => {
    it('should create a new review as buyer', async () => {
      const res = await request(app)
        .post(`/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          rating: 5,
          comment: 'Great seller!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.review.rating).toBe(5);
      testReview = res.body.review;
    });

    it('should not create multiple reviews for same seller', async () => {
      const res = await request(app)
        .post(`/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          rating: 4,
          comment: 'Another review'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not create review as seller', async () => {
      const res = await request(app)
        .post(`/reviews/sellers/${sellerId}/create`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          rating: 5,
          comment: 'Self review'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /reviews/sellers/:id', () => {
    it('should get seller reviews', async () => {
      const res = await request(app)
        .get(`/reviews/sellers/${sellerId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.reviews)).toBe(true);
      expect(res.body.average_rating).toBeDefined();
    });
  });

  describe('DELETE /reviews/:id/delete', () => {
    it('should delete own review as buyer', async () => {
      const res = await request(app)
        .delete(`/reviews/${testReview.id}/delete`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not delete other\'s review', async () => {
      const res = await request(app)
        .delete(`/reviews/${testReview.id}/delete`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
