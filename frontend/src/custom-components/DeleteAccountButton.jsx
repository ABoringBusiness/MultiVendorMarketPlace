import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUserAccount } from "@/store/slices/userSlice";

const DeleteAccountButton = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleDeleteAccount = () => {
    dispatch(deleteUserAccount());
    closeModal();
  };

  return (
    <>
      <button
        onClick={openModal}
        disabled={loading}
        className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete Account'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-md p-6 rounded-md shadow-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete your account? This action is irreversible.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                onClick={handleDeleteAccount}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccountButton;
