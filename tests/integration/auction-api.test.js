const request = require('supertest');
const express = require('express');
const app = express();
const { Auction, User, Category, Bid } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  Auction: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Category: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  Bid: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('../../src/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: '1', role: 'buyer' };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    next();
  }
}));

// Import routes
const auctionRoutes = require('../../src/routes/auctionRoutes');
const bidRoutes = require('../../src/routes/bidRoutes');

// Setup express app
app.use(express.json());
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);

describe('Auction API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auctions', () => {
    it('should return a list of auctions', async () => {
      // Mock auctions
      const mockAuctions = [
        { id: '1', title: 'Auction 1', currentBid: 100 },
        { id: '2', title: 'Auction 2', currentBid: 200 }
      ];
      
      Auction.findAll.mockResolvedValue(mockAuctions);

      const res = await request(app).get('/api/auctions');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body).toHaveProperty('auctions');
      expect(res.body.auctions).toHaveLength(2);
    });
  });

  describe('GET /api/auctions/:id', () => {
    it('should return a single auction', async () => {
      // Mock auction
      const mockAuction = {
        id: '1',
        title: 'Test Auction',
        description: 'This is a test auction',
        currentBid: 100,
        seller: { id: '2', name: 'Seller Name' },
        bids: [
          { id: '1', amount: 100, bidder: { id: '3', name: 'Bidder Name' } }
        ]
      };
      
      Auction.findByPk.mockResolvedValue(mockAuction);

      const res = await request(app).get('/api/auctions/1');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('auction');
      expect(res.body.auction).toHaveProperty('id', '1');
      expect(res.body.auction).toHaveProperty('title', 'Test Auction');
    });

    it('should return 404 if auction not found', async () => {
      Auction.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/auctions/999');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Auction not found');
    });
  });

  describe('POST /api/bids/:auctionId', () => {
    it('should place a bid on an auction', async () => {
      // Mock auction
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockAuction = {
        id: '1',
        title: 'Test Auction',
        status: 'active',
        endTime: tomorrow,
        sellerId: '2', // Different from req.user.id
        currentBid: 50,
        save: jest.fn().mockResolvedValue(true)
      };
      
      Auction.findByPk.mockResolvedValueOnce(mockAuction);
      
      // Mock no existing bid
      Bid.findOne.mockResolvedValue(null);
      
      // Mock bid creation
      Bid.create.mockResolvedValue({
        id: '1',
        auctionId: '1',
        bidderId: '1',
        amount: 100
      });
      
      // Mock updated auction
      Auction.findByPk.mockResolvedValueOnce({
        ...mockAuction,
        currentBid: 100,
        highestBidderId: '1',
        bids: [{ amount: 100, bidder: { id: '1', name: 'Test User' } }]
      });

      const res = await request(app)
        .post('/api/bids/1')
        .send({ amount: 100 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Bid placed successfully');
      expect(res.body).toHaveProperty('currentBid', 100);
    });
  });
});