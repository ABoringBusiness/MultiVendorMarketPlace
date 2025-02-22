import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ReportModel } from "../models/supabase/reportModel.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";

export const createReport = catchAsyncErrors(async (req, res, next) => {
  const { auctionId, reason, description } = req.body;

  if (!auctionId || !reason) {
    return next(new ErrorHandler("Auction ID and reason are required.", 400));
  }

  const auctionItem = await AuctionModel.findById(auctionId);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction item not found.", 404));
  }

  // Create the report
  const report = await ReportModel.create({
    auction_id: auctionId,
    reported_by: req.user.id,
    reason,
    description,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: "Report submitted successfully.",
    report
  });

});
