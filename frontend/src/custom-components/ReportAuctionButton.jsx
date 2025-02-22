import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const ReportAuctionButton = ({ auctionId }) => {
  return (
    <Link to={`/report-auction/${auctionId}`}>
      <button className="bg-[#d6482b] text-white px-4 py-2 rounded-md hover:bg-[#b8381e] transition-all duration-300">
        Report Auction
      </button>
    </Link>
  );
};

ReportAuctionButton.propTypes = {
  auctionId: PropTypes.string.isRequired
};

export default ReportAuctionButton;
