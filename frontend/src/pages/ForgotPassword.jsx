import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/v1/user/password/forgot', { email });
      setMessage(response.data.message);
      toast.success(response.data.message);
    } catch (err) {
      const errorMsg = err.response ? err.response.data.message : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8 justify-center">
      <div className="bg-white mx-auto w-full max-w-lg h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-4">Forgot Password</h1>
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-1">
            <label className="text-[16px] text-stone-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
              required
            />
          </div>
          <button
            className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-4 rounded-md text-white my-4"
            type="submit"
          >
            Send Reset Link
          </button>
        </form>
        <p className="text-stone-500 text-[16px] mt-4">
          Remembered your password?{' '}
          <Link to="/login" className="text-[#d6482b] font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPassword;
