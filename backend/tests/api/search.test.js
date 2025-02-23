import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

let server;

describe('Search API', () => {
  let sellerToken;
  let testProducts;

  beforeAll(async () => {
    server = app.listen();
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

    // Create test products
    const products = [
      {
        title: 'Digital Art 1',
        description: 'Beautiful digital art',
        price: 99.99,
        category_id: '123e4567-e89b-12d3-a456-426614174000'
      },
      {
        title: 'Photography Print',
        description: 'High quality photo print',
        price: 149.99,
        category_id: '223e4567-e89b-12d3-a456-426614174000'
      },
      {
        title: 'Abstract Painting',
        description: 'Modern abstract art',
        price: 299.99,
        category_id: '123e4567-e89b-12d3-a456-426614174000'
      }
    ];

    testProducts = await Promise.all(products.map(async (product) => {
      const res = await request(app)
        .post('/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(product);
      return res.body.product;
    }));
  });

  beforeEach(async () => {
    // Clear test data
    await supabase.from('products').delete().neq('id', '0');
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Search & Filtering', () => {
    describe('GET /search', () => {
      it('should search products by keyword', async () => {
        const res = await request(app)
          .get('/search?q=digital');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.products.some(p => p.title.toLowerCase().includes('digital'))).toBe(true);
      });

      it('should filter products by category', async () => {
        const res = await request(app)
          .get('/search?category=123e4567-e89b-12d3-a456-426614174000');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.products.every(p => p.category_id === '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      });

      it('should filter products by price range', async () => {
        const res = await request(app)
          .get('/search?min_price=100&max_price=200');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.products.every(p => p.price >= 100 && p.price <= 200)).toBe(true);
      });

      it('should combine search and filters', async () => {
        const res = await request(app)
          .get('/search?q=art&min_price=200');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.products.every(p => p.price >= 200)).toBe(true);
        expect(res.body.products.some(p => p.title.toLowerCase().includes('art'))).toBe(true);
      });
    });
  });
});
