import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { CommissionProofModel } from "../models/supabase/commissionProofModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";
import axios from "axios";

export const calculateCommission = async (auctionId) => {
  const auction = await AuctionModel.findById(auctionId);
  if (!auction) {
    throw new ErrorHandler("Auction not found.", 404);
  }
  const commissionRate = 0.01;
  const commission = auction.current_bid * commissionRate;
  return commission;
};

export const proofOfCommission = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Payment Proof Screenshot required.", 400));
  }
  const { proof } = req.files;
  const { amount, comment } = req.body;
  const user = await UserModel.findById(req.user.id);

  if (!amount || !comment) {
    return next(
      new ErrorHandler("Amount & comment are required fields.", 400)
    );
  }

  if (user.unpaid_commission === 0) {
    return res.status(200).json({
      success: true,
      message: "You don't have any unpaid commissions.",
    });
  }

  if (user.unpaid_commission < amount) {
    return next(
      new ErrorHandler(
        `The amount exceeds your unpaid commission balance. Please enter an amount up to ${user.unpaid_commission}`,
        403
      )
    );
  }

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(proof.mimetype)) {
    return next(new ErrorHandler("Screenshot format not supported.", 400));
  }

  // Upload image to TwicPics
  const formData = new FormData();
  formData.append('image', proof.buffer);
  
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
    return next(new ErrorHandler("Failed to upload payment proof.", 500));
  }

  const commissionProof = await CommissionProofModel.create({
    user_id: req.user.id,
    proof: {
      path: twicResponse.data.path,
      url: `${process.env.TWICPICS_DOMAIN}/${twicResponse.data.path}`
    },
    amount,
    comment,
  });
  res.status(201).json({
    success: true,
    message:
      "Your proof has been submitted successfully. We will review it and responed to you within 24 hours.",
    commissionProof,
  });
});
