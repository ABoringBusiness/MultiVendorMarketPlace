import { UserModel } from "../models/supabase/userModel.js";
import { CommissionProofModel } from "../models/supabase/commissionProofModel.js";
import { CommissionModel } from "../models/supabase/commissionModel.js";
import cron from "node-cron";
import { sendEmail } from "../utils/sendEmail.js";

export const verifyCommissionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Running Verify Commission Cron...");
    const approvedProofs = await CommissionProofModel.findByStatus("Approved");
    for (const proof of approvedProofs) {
      try {
        const user = await UserModel.findById(proof.user_id);
        let updatedUserData = {};
        
        if (user) {
          // Calculate new unpaid commission
          const newUnpaidCommission = user.unpaid_commission >= proof.amount ? 
            user.unpaid_commission - proof.amount : 
            0;
          
          // Update user's unpaid commission
          updatedUserData = await UserModel.update(user.id, {
            unpaid_commission: newUnpaidCommission
          });

          // Mark proof as settled
          await CommissionProofModel.update(proof.id, {
            status: "Settled"
          });

          // Create commission record
          await CommissionModel.create({
            amount: proof.amount,
            user_id: user.id
          });

          const settlementDate = new Date(Date.now())
            .toString()
            .substring(0, 15);

          const subject = `Your Payment Has Been Successfully Verified And Settled`;
          const message = `Dear ${user.user_name},\n\nWe are pleased to inform you that your recent payment has been successfully verified and settled. Thank you for promptly providing the necessary proof of payment. Your account has been updated, and you can now proceed with your activities on our platform without any restrictions.\n\nPayment Details:\nAmount Settled: ${proof.amount}\nUnpaid Amount: ${updatedUserData.unpaid_commission}\nDate of Settlement: ${settlementDate}\n\nBest regards,\nZeeshu Auction Team`;
          
          await sendEmail({ email: user.email, subject, message });
        }
        console.log(`User ${proof.user_id} paid commission of ${proof.amount}`);
      } catch (error) {
        console.error(
          `Error processing commission proof for user ${proof.userId}: ${error.message}`
        );
      }
    }
  });
};
