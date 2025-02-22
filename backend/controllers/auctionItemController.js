import { AuctionModel } from "../models/supabase/auctionModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { BidModel } from "../models/supabase/bidModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import axios from "axios";

export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Auction item image required.", 400));
  }

  const { image } = req.files;

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(image.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  const {
    title,
    description,
    category,
    condition,
    startingBid,
    startTime,
    endTime,
  } = req.body;
  if (
    !title ||
    !description ||
    !category ||
    !condition ||
    !startingBid ||
    !startTime ||
    !endTime
  ) {
    return next(new ErrorHandler("Please provide all details.", 400));
  }
  if (new Date(startTime) < Date.now()) {
    return next(
      new ErrorHandler(
        "Auction starting time must be greater than present time.",
        400
      )
    );
  }
  if (new Date(startTime) >= new Date(endTime)) {
    return next(
      new ErrorHandler(
        "Auction starting time must be less than ending time.",
        400
      )
    );
  }

  // Check if the auctioneer already has three active auctions
  const activeAuctions = await AuctionModel.findActive(req.user.id);
  if (activeAuctions.length >= 3) {
    return next(new ErrorHandler("You can only have up to 3 active auctions.", 400));
  }

  try {
    // Upload image to TwicPics
    const formData = new FormData();
    formData.append('image', image.buffer);
    
    const twicResponse = await axios.post('https://styley.twicpics.com/v1/upload', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.TWICPICS_TOKEN}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!twicResponse.data || twicResponse.data.error) {
      console.error(
        "TwicPics error:",
        twicResponse.data.error || "Unknown TwicPics error."
      );
      return next(
        new ErrorHandler("Failed to upload auction image to TwicPics.", 500)
      );
    }

    const auctionItem = await AuctionModel.create({
      title,
      description,
      category,
      condition,
      startingBid,
      startTime,
      endTime,
      image: {
        path: twicResponse.data.path,
        url: `${process.env.TWICPICS_DOMAIN}/${twicResponse.data.path}`
      },
      created_by: req.user.id
    });
    return res.status(201).json({
      success: true,
      message: `Auction item created and will be listed on auction page at ${startTime}`,
      auctionItem,
    });
  } catch (error) {
    return next(
      new ErrorHandler(error.message || "Failed to create auction.", 500)
    );
  }
});

export const getAllItems = catchAsyncErrors(async (req, res, next) => {
  const items = await AuctionModel.findAll();
  res.status(200).json({
    success: true,
    items,
  });
});

export const getAuctionDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const auctionItem = await AuctionModel.findById(id);

  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }

  // Get bids for this auction
  const bids = await BidModel.findByAuctionId(id);
  const bidders = bids.sort((a, b) => b.amount - a.amount);

  res.status(200).json({
    success: true,
    auctionItem,
    bidders,
  });
});

export const getMyAuctionItems = catchAsyncErrors(async (req, res, next) => {
  const items = await AuctionModel.findByUserId(req.user.id);
  res.status(200).json({
    success: true,
    items,
  });
});

export const removeFromAuction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  await auctionItem.deleteOne();
  res.status(200).json({
    success: true,
    message: "Auction item deleted successfully.",
  });
});

export const republishItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  let auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  if (!req.body.startTime || !req.body.endTime) {
    return next(
      new ErrorHandler("Starttime and Endtime for republish is mandatory.")
    );
  }
  if (new Date(auctionItem.endTime) > Date.now()) {
    return next(
      new ErrorHandler("Auction is already active, cannot republish", 400)
    );
  }
  let data = {
    startTime: new Date(req.body.startTime),
    endTime: new Date(req.body.endTime),
  };
  if (data.startTime < Date.now()) {
    return next(
      new ErrorHandler(
        "Auction starting time must be greater than present time",
        400
      )
    );
  }
  if (data.startTime >= data.endTime) {
    return next(
      new ErrorHandler(
        "Auction starting time must be less than ending time.",
        400
      )
    );
  }

  if (auctionItem.highestBidder) {
    const highestBidder = await User.findById(auctionItem.highestBidder);
    highestBidder.moneySpent -= auctionItem.currentBid;
    highestBidder.auctionsWon -= 1;
    highestBidder.save();
  }

  data.bids = [];
  data.commissionCalculated = false;
  data.currentBid = 0;
  data.highestBidder = null;
  auctionItem = await Auction.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  await Bid.deleteMany({ auctionItem: auctionItem._id });
  const createdBy = await User.findByIdAndUpdate(
    req.user._id,
    { unpaidCommission: 0 },
    {
      new: true,
      runValidators: false,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    auctionItem,
    message: `Auction republished and will be active on ${req.body.startTime}`,
    createdBy,
  });
});

export const preventAuctionSniping = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }

  const timeLeft = new Date(auctionItem.endTime) - Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const thirtyMinutes = 30 * 60 * 1000;

  if (timeLeft <= fiveMinutes) {
    auctionItem.endTime = new Date(auctionItem.endTime.getTime() + thirtyMinutes);
    await auctionItem.save();
    console.log("Auction end time extended by 30 minutes.");
    return res.status(200).json({
      success: true,
      message: "Auction end time extended by 30 minutes to prevent sniping.",
      auctionItem,
    });
  } else {
    console.log("No extension needed.");
    return res.status(200).json({
      success: true,
      message: "No extension needed.",
      auctionItem,
    });
  }
});
