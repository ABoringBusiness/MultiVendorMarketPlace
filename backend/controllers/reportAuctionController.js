import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Report } from "../models/reportSchema.js";
import { Auction } from "../models/auctionSchema.js";

export const createReport = catchAsyncErrors(async (req, res, next) => {
  const { auctionId, reason, description } = req.body;

  if (!auctionId || !reason) {
    return next(new ErrorHandler("Auction ID and reason are required.", 400));
  }

  const auctionItem = await Auction.findById(auctionId);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction item not found.", 404));
  }

  // Create the report
  const report = await Report.create({
    auctionId,
    reportedBy: req.user._id,
    reason,
    description,
  });

});
