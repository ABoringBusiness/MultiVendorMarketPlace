import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { CommissionModel } from "../models/supabase/commissionModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { CategorySuggestionModel } from "../models/supabase/categorySuggestionModel.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";
import { CommissionProofModel } from "../models/supabase/commissionProofModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { ReportModel } from "../models/supabase/reportModel.js";


export const deleteAuctionItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const deleted = await AuctionModel.delete(id);
  
  if (!deleted) {
    return next(new ErrorHandler("Auction not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Auction item deleted successfully.",
  });
});

export const getAllPaymentProofs = catchAsyncErrors(async (req, res, next) => {
  const paymentProofs = await CommissionProofModel.findAll();
  res.status(200).json({
    success: true,
    paymentProofs,
  });
});

export const getPaymentProofDetail = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    const paymentProofDetail = await CommissionProofModel.findById(id);
    
    if (!paymentProofDetail) {
      return next(new ErrorHandler("Payment proof not found.", 404));
    }

    res.status(200).json({
      success: true,
      paymentProofDetail,
    });
  }
);

export const updateProofStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { amount, status } = req.body;
  
  const proof = await CommissionProofModel.findById(id);
  if (!proof) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }

  const updatedProof = await CommissionProofModel.update(id, { status, amount });
  
  res.status(200).json({
    success: true,
    message: "Payment proof amount and status updated.",
    proof: updatedProof,
  });
});

export const deletePaymentProof = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const deleted = await CommissionProofModel.delete(id);
  
  if (!deleted) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Payment proof deleted.",
  });
});

export const fetchAllUsers = catchAsyncErrors(async (req, res, next) => {
  // Get all users with their creation timestamps
  const users = await UserModel.findAll();
  
  // Group users by month, year, and role
  const groupedUsers = users.reduce((acc, user) => {
    const date = new Date(user.created_at);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const role = user.role;
    
    const key = `${year}-${month}-${role}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Transform data into arrays by role
  const bidders = [];
  const auctioneers = [];
  
  Object.entries(groupedUsers).forEach(([key, count]) => {
    const [year, month, role] = key.split('-');
    if (role === 'Bidder') {
      bidders.push({ month: parseInt(month), count });
    } else if (role === 'Auctioneer') {
      auctioneers.push({ month: parseInt(month), count });
    }
  });

  const transformDataToMonthlyArray = (data, totalMonths = 12) => {
    const result = Array(totalMonths).fill(0);
    data.forEach((item) => {
      result[item.month - 1] = item.count;
    });
    return result;
  };

  const biddersArray = transformDataToMonthlyArray(bidders);
  const auctioneersArray = transformDataToMonthlyArray(auctioneers);

  res.status(200).json({
    success: true,
    biddersArray,
    auctioneersArray,
  });
});

export const monthlyRevenue = catchAsyncErrors(async (req, res, next) => {
  // Get all commissions with their creation timestamps
  const commissions = await CommissionModel.findAll();
  
  // Group commissions by month and year, summing the amounts
  const groupedCommissions = commissions.reduce((acc, commission) => {
    const date = new Date(commission.created_at);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const key = `${year}-${month}`;
    acc[key] = (acc[key] || 0) + commission.amount;
    return acc;
  }, {});

  // Transform data into monthly array
  const transformDataToMonthlyArray = (data, totalMonths = 12) => {
    const result = Array(totalMonths).fill(0);
    
    Object.entries(data).forEach(([key, amount]) => {
      const [_, month] = key.split('-');
      result[parseInt(month) - 1] = amount;
    });
    
    return result;
  };

  const totalMonthlyRevenue = transformDataToMonthlyArray(groupedCommissions);
  
  res.status(200).json({
    success: true,
    totalMonthlyRevenue,
  });
});


export const fetchAllUserDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await User.find({}, 'userName email role address phone profileImage createdAt');

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details.",
    });
  }
});

export const fetchAllCategorySuggestions = catchAsyncErrors(async (req, res, next) => {
  const suggestions = await CategorySuggestion.find();
  res.status(200).json({
    success: true,
    suggestions,
  });
});

export const approveCategorySuggestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const suggestion = await CategorySuggestion.findById(id);
  if (!suggestion) {
    return next(new ErrorHandler("Suggestion not found.", 404));
  }
  suggestion.status = "Approved";
  await suggestion.save();

  const user = await User.findById(suggestion.suggestedBy);
  if (user) {
    await sendEmail({
      email: user.email,
      subject: "Category Suggestion Approved",
      message: `Your suggested category "${suggestion.suggestedCategory}" has been approved. Thank you for your contribution!`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Category suggestion approved successfully.",
  });
});

export const rejectCategorySuggestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const suggestion = await CategorySuggestion.findById(id);
  if (!suggestion) {
    return next(new ErrorHandler("Suggestion not found.", 404));
  }
  suggestion.status = "Rejected";
  await suggestion.save();

  const user = await User.findById(suggestion.suggestedBy);
  if (user) {
    await sendEmail({
      email: user.email,
      subject: "Category Suggestion Rejected",
      message: `Your suggested category "${suggestion.suggestedCategory}" has been rejected. Thank you for your effort!`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Category suggestion rejected successfully.",
  });
});


export const getAllReportedAuctions = catchAsyncErrors(async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate("auctionId", "title image.url startingBid condition")
      .populate("reportedBy", "userName email"); 

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching reported auctions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reported auctions",
    });
  }
});


/// new code for report status
export const updateReportStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; 
  const { status } = req.body; 

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid ID format.", 400));
  }

  if (!['Pending', 'Reviewed', 'Resolved'].includes(status)) {
    return next(new ErrorHandler("Invalid status value.", 400));
  }

  try {
    const report = await Report.findById(id).populate("auctionId", "title createdBy");

    if (!report) {
      return next(new ErrorHandler("Report not found.", 404));
    }

    report.status = status;
    await report.save();

    if (status === "Resolved") {
      const auction = await Auction.findById(report.auctionId._id).populate("createdBy", "email userName");

      if (!auction) {
        return next(new ErrorHandler("Auction associated with the report not found.", 404));
      }

      const auctioneerEmail = auction.createdBy.email;
      const auctioneerName = auction.createdBy.userName;

      await auction.deleteOne();

      const emailSubject = "Auction Removed Due to Reports";
      const emailMessage = `
        Dear ${auctioneerName},

        We regret to inform you that your auction titled "${auction.title}" has been removed from our platform due to multiple reports from users.

        If you have any questions or believe this is a mistake, please contact our support team.

        Thank you for your understanding.

        Best regards,
        The Auction Platform Team
      `;

      await sendEmail({
        email: auctioneerEmail,
        subject: emailSubject,
        message: emailMessage,
      });

      console.log("Notification email sent to auctioneer.");
    }

    res.status(200).json({
      success: true,
      message: "Report status updated successfully.",
      report,
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update report status.",
    });
  }
});
