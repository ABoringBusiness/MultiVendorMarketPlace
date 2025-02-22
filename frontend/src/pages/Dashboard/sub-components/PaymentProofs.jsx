import {
  deletePaymentProof,
  getSinglePaymentProofDetail,
  updatePaymentProof,
} from "@/store/slices/superAdminSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaTrashAlt, FaEdit } from "react-icons/fa";
import PropTypes from 'prop-types';

const PaymentProofs = () => {
  const { paymentProofs } = useSelector(
    (state) => state.superAdmin
  );
  const [openDrawer, setOpenDrawer] = useState(false);
  const dispatch = useDispatch();

  const handlePaymentProofDelete = (id) => {
    dispatch(deletePaymentProof(id));
  };

  const handleFetchPaymentDetail = (id) => {
    dispatch(getSinglePaymentProofDetail(id));
    setOpenDrawer(true);
  };

  return (
    <section className="w-full p-8 bg-gray-50 min-h-screen flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Manage Payment Proofs</h1>
        </div>
        {paymentProofs.length > 0 ? (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">User ID</th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="py-4 px-6 bg-gray-200 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {paymentProofs.map((element) => (
                <tr key={element._id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">{element.userId}</td>
                  <td className="py-4 px-6">{element.status}</td>
                  <td className="py-4 px-6 text-center flex justify-center items-center gap-4">
                    <button
                      className="bg-blue-500 text-white flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-all duration-300"
                      onClick={() => handleFetchPaymentDetail(element._id)}
                      title="Update Payment Proof"
                    >
                      <FaEdit /> Update
                    </button>
                    <button
                      className="bg-red-500 text-white flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-700 transition-all duration-300"
                      onClick={() => handlePaymentProofDelete(element._id)}
                      title="Delete Payment Proof"
                    >
                      <FaTrashAlt /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-xl text-sky-600 py-3">No payment proofs are found.</p>
        )}
      </div>
      {openDrawer && <Drawer setOpenDrawer={setOpenDrawer} openDrawer={openDrawer} />}
    </section>
  );
};

Drawer.propTypes = {
  setOpenDrawer: PropTypes.func.isRequired,
  openDrawer: PropTypes.bool.isRequired
};

PaymentProofs.propTypes = {
  setOpenDrawer: PropTypes.func.isRequired,
  openDrawer: PropTypes.bool.isRequired
};

export default PaymentProofs;

export const Drawer = ({ setOpenDrawer, openDrawer }) => {
  const { singlePaymentProof, loading } = useSelector(
    (state) => state.superAdmin
  );
  const [amount, setAmount] = useState(singlePaymentProof.amount || "");
  const [status, setStatus] = useState(singlePaymentProof.status || "");

  const dispatch = useDispatch();

  useEffect(() => {
    if (singlePaymentProof) {
      setAmount(singlePaymentProof.amount || "");
      setStatus(singlePaymentProof.status || "");
    }
  }, [singlePaymentProof]);

  const handlePaymentProofUpdate = () => {
    dispatch(updatePaymentProof(singlePaymentProof._id, status, amount));
  };

  return (
    <section
      className={`fixed ${
        openDrawer && singlePaymentProof.userId ? "bottom-0" : "-bottom-full"
      }  left-0 w-full transition-all duration-300 h-full bg-[#00000087] flex items-end`}
    >
      <div className="bg-white h-fit transition-all duration-300 w-full">
        <div className="w-full px-5 py-8 sm:max-w-[640px] sm:m-auto">
          <h3 className="text-[#D6482B]  text-3xl font-semibold text-center mb-1">
            Update Payment Proof
          </h3>
          <p className="text-stone-600">
            You can update payment status and amount.
          </p>
          <form className="flex flex-col gap-5 my-5">
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600 ">User ID</label>
              <input
                type="text"
                value={singlePaymentProof.userId || ""}
                disabled
                className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-none  text-stone-600"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Settled">Settled</option>
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">Comment</label>
              <textarea
                rows={5}
                value={singlePaymentProof.comment || ""}
                disabled
                className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-none text-stone-600"
              />
            </div>
            <div>
              <Link
                to={singlePaymentProof.proof?.url || ""}
                className="bg-[#D6482B] flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-[#b8381e]"
                target="_blank"
              >
                Payment Proof (SS)
              </Link>
            </div>
            <div>
              <button
                type="button"
                className="bg-blue-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-blue-700"
                onClick={handlePaymentProofUpdate}
              >
                {loading ? "Updating Payment Proof" : "Update Payment Proof"}
              </button>
            </div>
            <div>
              <button
                type="button"
                className="bg-yellow-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-yellow-700"
                onClick={() => setOpenDrawer(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
