import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport, resetReportState } from '@/store/slices/reportAuctionSlice';
import { useParams } from 'react-router-dom';

const ReportForm = () => {
  const { auctionId } = useParams();
  const dispatch = useDispatch();
  const { loading, success } = useSelector((state) => state.report);

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (success) {
      setReason('');
      setDescription('');
      dispatch(resetReportState());
    }
  }, [success, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!auctionId || !reason) {
      alert('Auction ID and reason are required.');
      return;
    }

    dispatch(createReport({ auctionId, reason, description }));
  };

  return (
    <section className="w-full px-5 pt-[120px] lg:px-[60px] flex flex-col min-h-screen py-8 justify-center bg-gray-50">
      <div className="bg-white mx-auto w-full max-w-3xl h-auto px-10 py-12 flex flex-col gap-8 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-6">Report Auction</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-lg text-stone-600 font-medium">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="text-lg py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
            >
              <option value="">Select Reason</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Fraudulent Activity">Fraudulent Activity</option>
              <option value="Misleading Information">Misleading Information</option>
              <option value="Spam or Fake Auction">Spam or Fake Auction</option>
              <option value="Violation of Rules">Violation of Rules</option>
              <option value="Seller Misconduct">Seller Misconduct</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-lg text-stone-600 font-medium">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="text-lg py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
            />
          </div>
          <button
            className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-2xl py-4 rounded-md text-white mt-6"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ReportForm;
