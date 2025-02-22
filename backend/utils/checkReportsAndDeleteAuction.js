import { ReportModel } from "../models/supabase/reportModel.js";
import { AuctionModel } from "../models/supabase/auctionModel.js";

export const checkReportedAuctions = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all reports from the last 24 hours
    const recentReports = await ReportModel.findRecentReports(twentyFourHoursAgo);
    
    // Group reports by auction and reason
    const reportGroups = recentReports.reduce((acc, report) => {
      const key = `${report.auction_id}:${report.reason}`;
      if (!acc[key]) {
        acc[key] = {
          auction_id: report.auction_id,
          reason: report.reason,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    // Filter groups with 10 or more reports
    const reports = Object.values(reportGroups).filter(group => group.count >= 10);

    // Iterate over the grouped reports to delete auctions
    for (const report of reports) {
      const { auction_id, reason } = report;

      // Delete the auction if it exists
      const auction = await AuctionModel.findById(auction_id);
      if (auction) {
        await AuctionModel.delete(auction_id);
        console.log(
          `Auction ${auction_id} deleted due to receiving 10 or more reports for the reason: ${reason}.`
        );

        // Update related reports to "Resolved"
        await ReportModel.updateByAuctionId(auction_id, {
          status: "Resolved"
        });
      }
    }

    console.log("Cron job completed: checked and handled reported auctions.");
  } catch (error) {
    console.error("Error in checkReportedAuctions cron job:", error);
  }
};
