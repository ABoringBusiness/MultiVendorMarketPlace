import request from 'supertest';
import { app } from '../../app.js';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';

describe('Product API', () => {
  let sellerToken;
  let buyerToken;
  let testProduct;

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
    await supabase.from('products').delete().neq('id', '0');
  });

  describe('POST /products/create', () => {
    it('should create a new product as seller', async () => {
      const res = await request(app)
        .post('/products/create')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          category_id: '123e4567-e89b-12d3-a456-426614174000'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product.title).toBe('Test Product');
      testProduct = res.body.product;
    });

    it('should not create product as buyer', async () => {
      const res = await request(app)
        .post('/products/create')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 99.99
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /products/list', () => {
    it('should list all active products', async () => {
      const res = await request(app)
        .get('/products/list');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
    });
  });

  describe('GET /products/:id', () => {
    it('should get product details', async () => {
      const res = await request(app)
        .get(`/products/${testProduct.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.id).toBe(testProduct.id);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/products/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
