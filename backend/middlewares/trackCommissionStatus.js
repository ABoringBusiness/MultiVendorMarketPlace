import { UserModel } from "../models/supabase/userModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const trackCommissionStatus = catchAsyncErrors(
  async (req, res, next) => {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    
    if (user.unpaid_commission > 0) {
      return next(
        new ErrorHandler(
          "You have unpaid commissions. Please pay them before posting a new auction.",
          403
        )
      );
    }
    next();
  }
);
