import cron from "node-cron";
import { Report } from "../models/reportSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js"; // Import the User model
import { Bid } from "../models/bidSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

export const checkReportedAuctionsCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Cron for checking reported auctions running...");
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      const auctionIds = await Report.distinct("auctionId", {
        createdAt: { $gte: twentyFourHoursAgo },
      });

      for (const auctionId of auctionIds) {
        const reports = await Report.aggregate([
          {
            $match: {
              auctionId,
              createdAt: { $gte: twentyFourHoursAgo },
            },
          },
          {
            $group: {
              _id: "$reason",
              count: { $sum: 1 },
            },
          },
          {
            $match: { count: { $gte: 10 } },
          },
        ]);

        if (reports.length > 0) {
          const auction = await Auction.findById(auctionId);

          if (!auction) {
            console.warn(`Auction ${auctionId} not found. Skipping.`);
            continue;
          }

          console.log(`Deleting auction ${auctionId} due to excessive reports...`);

          try {
            // Delete related bids first
            await Bid.deleteMany({ auctionItem: auctionId });

            // Notify the auctioneer via email
            const auctioneer = await User.findById(auction.createdBy);
            if (auctioneer) {
              const subject = `Your Auction "${auction.title}" Has Been Removed`;
              const message = `Dear ${auctioneer.userName},\n\nYour auction titled "${auction.title}" has been removed due to receiving multiple reports for the same reason within 24 hours.\n\nIf you believe this was a mistake, please contact our support team.\n\nBest regards,\nThe NelamiGhar Team.`;

              await sendEmail({
                email: auctioneer.email,
                subject,
                message,
              });

              console.log(`Email sent to auctioneer: ${auctioneer.email}`);
            }

            // Delete the auction
            await auction.deleteOne();

            // Update related reports
            await Report.updateMany(
              { auctionId },
              { $set: { status: "Resolved" } }
            );

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
