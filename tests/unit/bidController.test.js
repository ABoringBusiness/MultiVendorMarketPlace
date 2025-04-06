const { placeBid, getAuctionBids, getUserBids, getHighestBid } = require('../../src/controllers/bidController');
const { Auction, Bid, User, Category } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
  Auction: {
    findByPk: jest.fn(),
  },
  Bid: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
  User: {},
  Category: {},
}));

describe('Bid Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response
    req = {
      params: { auctionId: '1' },
      body: { amount: 100 },
      user: { id: '2' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('placeBid', () => {
    it('should return 404 if auction not found', async () => {
      // Mock auction not found
      Auction.findByPk.mockResolvedValue(null);

      await placeBid(req, res);

      expect(Auction.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction not found' });
    });

    it('should return 400 if auction is not active', async () => {
      // Mock inactive auction
      Auction.findByPk.mockResolvedValue({
        id: '1',
        status: 'ended',
        sellerId: '3'
      });

      await placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction is not active' });
    });

    it('should return 400 if auction has ended', async () => {
      // Mock ended auction
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      Auction.findByPk.mockResolvedValue({
        id: '1',
        status: 'active',
        endTime: pastDate,
        sellerId: '3'
      });

      await placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction has ended' });
    });

    it('should return 400 if user is the seller', async () => {
      // Mock auction where user is seller
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      Auction.findByPk.mockResolvedValue({
        id: '1',
        status: 'active',
        endTime: futureDate,
        sellerId: '2' // Same as req.user.id
      });

      await placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'You cannot bid on your own auction' });
    });

    it('should return 400 if bid amount is not higher than current bid', async () => {
      // Mock auction with higher current bid
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      Auction.findByPk.mockResolvedValue({
        id: '1',
        status: 'active',
        endTime: futureDate,
        sellerId: '3',
        currentBid: 150 // Higher than req.body.amount (100)
      });

      await placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Bid amount must be higher than the current bid',
        currentBid: 150
      });
    });

    it('should return 400 if first bid is lower than starting bid', async () => {
      // Mock auction with no bids but higher starting bid
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      Auction.findByPk.mockResolvedValue({
        id: '1',
        status: 'active',
        endTime: futureDate,
        sellerId: '3',
        currentBid: 0,
        startingBid: 150 // Higher than req.body.amount (100)
      });

      await placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Bid amount must be at least the starting bid',
        startingBid: 150
      });
    });

    it('should update existing bid if user already has a bid', async () => {
      // Mock valid auction
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const mockAuction = {
        id: '1',
        status: 'active',
        endTime: futureDate,
        sellerId: '3',
        currentBid: 50,
        save: jest.fn().mockResolvedValue(true)
      };
      
      Auction.findByPk.mockResolvedValueOnce(mockAuction);
      
      // Mock existing bid
      const mockExistingBid = {
        id: '1',
        auctionId: '1',
        bidderId: '2',
        amount: 50,
        save: jest.fn().mockResolvedValue(true)
      };
      
      Bid.findOne.mockResolvedValue(mockExistingBid);
      
      // Mock updated auction
      Auction.findByPk.mockResolvedValueOnce({
        ...mockAuction,
        bids: [{ amount: 100, bidder: { id: '2', name: 'Test User' } }]
      });

      await placeBid(req, res);

      expect(mockExistingBid.amount).toBe(100);
      expect(mockExistingBid.save).toHaveBeenCalled();
      expect(mockAuction.currentBid).toBe(100);
      expect(mockAuction.highestBidderId).toBe('2');
      expect(mockAuction.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Bid placed successfully',
        currentBid: 100
      }));
    });

    it('should create new bid if user does not have an existing bid', async () => {
      // Mock valid auction
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const mockAuction = {
        id: '1',
        status: 'active',
        endTime: futureDate,
        sellerId: '3',
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
        bidderId: '2',
        amount: 100
      });
      
      // Mock updated auction
      Auction.findByPk.mockResolvedValueOnce({
        ...mockAuction,
        bids: [{ amount: 100, bidder: { id: '2', name: 'Test User' } }]
      });

      await placeBid(req, res);

      expect(Bid.create).toHaveBeenCalledWith({
        auctionId: '1',
        bidderId: '2',
        amount: 100
      });
      expect(mockAuction.currentBid).toBe(100);
      expect(mockAuction.highestBidderId).toBe('2');
      expect(mockAuction.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Bid placed successfully',
        currentBid: 100
      }));
    });
  });

  describe('getAuctionBids', () => {
    it('should return 404 if auction not found', async () => {
      // Mock auction not found
      Auction.findByPk.mockResolvedValue(null);

      await getAuctionBids(req, res);

      expect(Auction.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Auction not found' });
    });

    it('should return bids for an auction', async () => {
      // Mock auction found
      Auction.findByPk.mockResolvedValue({
        id: '1',
        title: 'Test Auction'
      });
      
      // Mock bids
      const mockBids = [
        { id: '1', amount: 100, bidder: { id: '2', name: 'User 1' } },
        { id: '2', amount: 90, bidder: { id: '3', name: 'User 2' } }
      ];
      
      Bid.findAll.mockResolvedValue(mockBids);

      await getAuctionBids(req, res);

      expect(Bid.findAll).toHaveBeenCalledWith({
        where: { auctionId: '1' },
        include: [{ model: User, as: "bidder", attributes: ["id", "name"] }],
        order: [['amount', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        bids: mockBids
      });
    });
  });
});