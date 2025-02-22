import cron from "node-cron";
import { AuctionModel } from "../models/supabase/auctionModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { BidModel } from "../models/supabase/bidModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { calculateCommission } from "../controllers/commissionController.js";

export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log("Cron for ended auction running...");
    const endedAuctions = await AuctionModel.findEndedUncalculated(now);
    
    for (const auction of endedAuctions) {
      try {
        const commissionAmount = await calculateCommission(auction.id);
        
        // Find highest bidder
        const highestBidder = await BidModel.findHighestForAuction(auction.id);
        const auctioneer = await UserModel.findById(auction.created_by);
        
        if (highestBidder) {
          // Update auction with highest bidder
          await AuctionModel.update(auction.id, {
            highest_bidder: highestBidder.bidder_id,
            commission_calculated: true
          });

          // Update bidder stats
          const bidder = await UserModel.findById(highestBidder.bidder_id);
          await UserModel.updateStats(bidder.id, {
            money_spent: highestBidder.amount,
            auctions_won: 1
          });

          // Update auctioneer commission
          await UserModel.update(auctioneer.id, {
            unpaid_commission: commissionAmount
          });

          // Send email notification
          const subject = `Congratulations! You won the auction for ${auction.title}`;
          const message = `Dear ${bidder.user_name}, \n\nCongratulations! You have won the auction for ${auction.title}. \n\nBefore proceeding for payment contact your auctioneer via your auctioneer email:${auctioneer.email} or his phone number:${auctioneer.phone}  \n\nPlease complete your payment using one of the following methods:\n\n1. **Bank Transfer**: \n- Account Name: ${auctioneer.payment_methods.bank_transfer.account_name} \n- Account Number: ${auctioneer.payment_methods.bank_transfer.account_number} \n- Bank: ${auctioneer.payment_methods.bank_transfer.bank_name}\n\n2. **Easypaise**:\n- You can send payment via Easypaise: ${auctioneer.payment_methods.easypaisa.account_number}\n\n3. **PayPal**:\n- Send payment to: ${auctioneer.payment_methods.paypal.email}\n\n4. **Cash on Delivery (COD)**:\n- If you prefer COD, you must pay 20% of the total amount upfront before delivery.\n- To pay the 20% upfront, use any of the above methods.\n- The remaining 80% will be paid upon delivery.\n- If you want to see the condition of your auction item then send your email on this: ${auctioneer.email}\n\nPlease ensure your payment is completed by [Payment Due Date]. Once we confirm the payment, the item will be shipped to you.\n\nThank you for participating!\n\nBest regards,\n NelamiGhar Team`;
          
          console.log("SENDING EMAIL TO HIGHEST BIDDER");
          await sendEmail({ email: bidder.email, subject, message });
          console.log("SUCCESSFULLY EMAIL SENT TO HIGHEST BIDDER");
        } else {
          // Just mark commission as calculated if no bidder
          await AuctionModel.update(auction.id, {
            commission_calculated: true
          });
        }
      } catch (error) {
        console.error(error || "Some error in ended auction cron");
      }
    }
  });
};
