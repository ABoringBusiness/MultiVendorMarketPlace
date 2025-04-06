const { createAuction } = require('../../src/controllers/auctionController');
const { Auction, Category } = require('../../src/models');
const { Op } = require('sequelize');

// Mock the models
jest.mock('../../src/models', () => ({
  Auction: {
    create: jest.fn(),
    count: jest.fn(),
    findByPk: jest.fn(),
  },
  Category: {
    findByPk: jest.fn(),
  },
  User: {},
  Bid: {},
}));

// Mock Sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gt: Symbol('gt'),
    in: Symbol('in'),
  }
}));

describe('Auction Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up future dates for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Mock request and response
    req = {
      body: {
        title: 'Test Auction',
        description: 'This is a test auction',
        categoryId: '1',
        condition: 'new',
        startingBid: 50,
        startTime: tomorrow.toISOString(),
        endTime: dayAfterTomorrow.toISOString(),
        imageUrl: 'http://example.com/image.jpg'
      },
      user: { id: '1' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createAuction', () => {
    it('should return 400 if required fields are missing', async () => {
      // Missing title
      req.body = {
        ...req.body,
        title: undefined
      };

      await createAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Please provide all required fields' 
      });
    });

    it('should return 400 if category does not exist', async () => {
      // Mock category not found
      Category.findByPk.mockResolvedValue(null);

      await createAuction(req, res);

      expect(Category.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Invalid category ID' 
      });
    });

    it('should return 400 if start time is in the past', async () => {
      // Set start time to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      req.body.startTime = yesterday.toISOString();

      // Mock category found
      Category.findByPk.mockResolvedValue({ id: '1', name: 'Electronics' });

      await createAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Auction starting time must be in the future' 
      });
    });

    it('should return 400 if end time is before start time', async () => {
      // Set end time before start time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      req.body.startTime = dayAfterTomorrow.toISOString(); // Later
      req.body.endTime = tomorrow.toISOString(); // Earlier

      // Mock category found
      Category.findByPk.mockResolvedValue({ id: '1', name: 'Electronics' });

      await createAuction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Auction ending time must be after starting time' 
      });
    });

    it('should return 400 if seller already has 3 active auctions', async () => {
      // Mock category found
      Category.findByPk.mockResolvedValue({ id: '1', name: 'Electronics' });
      
      // Mock seller has 3 active auctions
      Auction.count.mockResolvedValue(3);

      await createAuction(req, res);

      expect(Auction.count).toHaveBeenCalledWith({
        where: {
          sellerId: '1',
          endTime: { [Op.gt]: expect.any(Date) },
          status: { [Op.in]: ['pending', 'active'] }
        }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'You can only have up to 3 active auctions' 
      });
    });

    it('should create a new auction successfully', async () => {
      // Mock category found
      Category.findByPk.mockResolvedValue({ id: '1', name: 'Electronics' });
      
      // Mock seller has fewer than 3 active auctions
      Auction.count.mockResolvedValue(2);
      
      // Mock auction creation
      const mockAuction = {
        id: '1',
        title: 'Test Auction',
        description: 'This is a test auction',
        categoryId: '1',
        condition: 'new',
        startingBid: 50,
        currentBid: 0,
        sellerId: '1',
        status: 'pending'
      };
      
      Auction.create.mockResolvedValue(mockAuction);

      await createAuction(req, res);

      expect(Auction.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Auction',
        description: 'This is a test auction',
        categoryId: '1',
        condition: 'new',
        startingBid: 50,
        sellerId: '1'
      }));
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        auction: mockAuction
      }));
    });
  });
});