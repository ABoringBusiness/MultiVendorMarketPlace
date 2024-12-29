import { Report } from "../models/reportSchema.js";
import { Auction } from "../models/auctionSchema.js";

export const checkReportedAuctions = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Aggregate reports for auctions within the last 24 hours
    const reports = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: twentyFourHoursAgo }, // Only consider reports from the last 24 hours
        },
      },
      {
        $group: {
          _id: { auctionId: "$auctionId", reason: "$reason" }, // Group by auctionId and reason
          count: { $sum: 1 }, // Count the number of reports
        },
      },
      {
        $match: { count: { $gte: 10 } }, // Only groups with 10 or more reports
      },
    ]);

    // Iterate over the grouped reports to delete auctions
    for (const report of reports) {
      const { auctionId, reason } = report._id;

      // Delete the auction if it exists
      const auction = await Auction.findById(auctionId);
      if (auction) {
        await auction.deleteOne();
        console.log(
          `Auction ${auctionId} deleted due to receiving 10 or more reports for the reason: ${reason}.`
        );

        // Optionally update related reports to "Resolved"
        await Report.updateMany(
          { auctionId, reason },
          { $set: { status: "Resolved" } }
        );
      }
    }

    console.log("Cron job completed: checked and handled reported auctions.");
  } catch (error) {
    console.error("Error in checkReportedAuctions cron job:", error);
  }
};
