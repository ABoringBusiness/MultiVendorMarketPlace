import cron from "node-cron";
import { ReportModel } from "../models/supabase/reportModel.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { BidModel } from "../models/supabase/bidModel.js";
import { sendEmail } from "../utils/sendEmail.js";

export const checkReportedAuctionsCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Cron for checking reported auctions running...");
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Get reported auctions from last 24 hours
      const recentReports = await ReportModel.findRecentReports(twentyFourHoursAgo);
      
      // Group reports by auction and reason
      const reportsByAuction = recentReports.reduce((acc, report) => {
        if (!acc[report.auction_id]) {
          acc[report.auction_id] = {};
        }
        if (!acc[report.auction_id][report.reason]) {
          acc[report.auction_id][report.reason] = 0;
        }
        acc[report.auction_id][report.reason]++;
        return acc;
      }, {});

      // Check each auction for excessive reports
      for (const [auctionId, reasons] of Object.entries(reportsByAuction)) {
        // Check if any reason has 10 or more reports
        const hasExcessiveReports = Object.values(reasons).some(count => count >= 10);

        if (hasExcessiveReports) {
          const auction = await AuctionModel.findById(auctionId);

          if (!auction) {
            console.warn(`Auction ${auctionId} not found. Skipping.`);
            continue;
          }

          console.log(`Deleting auction ${auctionId} due to excessive reports...`);

          try {
            // Delete related bids first
            await BidModel.deleteByAuctionId(auctionId);

            // Notify the auctioneer via email
            const auctioneer = await UserModel.findById(auction.created_by);
            if (auctioneer) {
              const subject = `Your Auction "${auction.title}" Has Been Removed`;
              const message = `Dear ${auctioneer.user_name},\n\nYour auction titled "${auction.title}" has been removed due to receiving multiple reports for the same reason within 24 hours.\n\nIf you believe this was a mistake, please contact our support team.\n\nBest regards,\nThe NelamiGhar Team.`;

              await sendEmail({
                email: auctioneer.email,
                subject,
                message,
              });

              console.log(`Email sent to auctioneer: ${auctioneer.email}`);
            }

            // Delete the auction
            await AuctionModel.delete(auctionId);

            // Update related reports
            await ReportModel.updateByAuctionId(auctionId, {
              status: "Resolved"
            });

            console.log(`Auction deleted successfully.`);
          } catch (error) {
            console.error(`Error while deleting auction:`, error.message || error);
          }
        }
      }
    } catch (error) {
      console.error("Error in checking reported auctions cron job:", error.message || error);
    }
  });
};
