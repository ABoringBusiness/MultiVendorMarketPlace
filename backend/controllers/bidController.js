import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";
import { BidModel } from "../models/supabase/bidModel.js";
import { UserModel } from "../models/supabase/userModel.js";

export const placeBid = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const auctionItem = await AuctionModel.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction Item not found.", 404));
  }
  
  const { amount } = req.body;
  if (!amount) {
    return next(new ErrorHandler("Please place your bid.", 404));
  }
  
  if (amount <= auctionItem.current_bid) {
    return next(
      new ErrorHandler("Bid amount must be greater than the current bid.", 404)
    );
  }
  
  if (amount < auctionItem.starting_bid) {
    return next(
      new ErrorHandler("Bid amount must be greater than starting bid.", 404)
    );
  }

  try {
    const existingBid = await BidModel.findByBidderAndAuction(req.user.id, id);
    const bidderDetail = await UserModel.findById(req.user.id);
    
    if (existingBid) {
      // Update existing bid
      await BidModel.update(existingBid.id, { amount });
      
      // Update auction's current bid
      await AuctionModel.update(id, {
        current_bid: amount,
        bids: auctionItem.bids.map(bid => 
          bid.user_id === req.user.id ? { ...bid, amount } : bid
        )
      });
    } else {
      // Create new bid
      await BidModel.create({
        amount,
        bidder_id: bidderDetail.id,
        auction_id: id,
        bidder_name: bidderDetail.user_name,
        bidder_image: bidderDetail.profile_image?.url
      });
      
      // Update auction with new bid
      const newBid = {
        user_id: req.user.id,
        user_name: bidderDetail.user_name,
        profile_image: bidderDetail.profile_image?.url,
        amount
      };
      
      await AuctionModel.update(id, {
        current_bid: amount,
        bids: [...(auctionItem.bids || []), newBid]
      });

    res.status(201).json({
      success: true,
      message: "Bid placed.",
      currentBid: auctionItem.currentBid,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || "Failed to place bid.", 500));
  }
});
