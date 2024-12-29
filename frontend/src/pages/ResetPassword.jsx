import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/v1/user/password/reset/${token}`, { password });
      toast.success(response.data.message);
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response ? err.response.data.message : 'An error occurred';
      toast.error(errorMsg);
    }
  };

  return (
    <section className="w-full ml-0 m-0 h-fit px-8 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-8 justify-center">
      <div className="bg-white mx-auto w-full max-w-2xl h-auto px-6 py-8 flex flex-col gap-6 items-center justify-center rounded-md shadow-md">
        <h1 className="text-[#d6482b] text-3xl font-bold mb-4">Reset Password</h1>
        <form onSubmit={handleResetPassword} className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-1">
            <label className="text-[16px] text-stone-500">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[16px] text-stone-500">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
              required
            />
          </div>
          <button
            className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-4 rounded-md text-white my-4"
            type="submit"
          >
            Reset Password
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
