import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { supabase } from '../../database/connection.js';
import { ROLES } from '../../constants/roles.js';
import authRouter from '../../router/auth.js';
import { errorMiddleware } from '../../middlewares/error.js';
import { UserModel } from '../../models/supabase/userModel.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);
app.use(errorMiddleware);

describe('Authentication API', () => {
  beforeEach(async () => {
    // Reset mock implementations
    jest.resetAllMocks();
    
    // Setup default mock responses
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockImplementation((data) => Promise.resolve({
      id: 'test-user-id',
      ...data
    }));
  });

  describe('POST /auth/register', () => {
    it('should register a new buyer', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'buyer@test.com',
          password: 'test123',
          name: 'Test Buyer',
          role: ROLES.BUYER
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('buyer@test.com');
      expect(res.body.user.role).toBe(ROLES.BUYER);
    });

    it('should register a new seller', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'seller@test.com',
          password: 'test123',
          name: 'Test Seller',
          role: ROLES.SELLER
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('seller@test.com');
      expect(res.body.user.role).toBe(ROLES.SELLER);
    });

    it('should not register with invalid role', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'test123',
          name: 'Test User',
          role: 'invalid_role'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'test123',
          name: 'Test User',
          role: ROLES.BUYER
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'test123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrong_password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
