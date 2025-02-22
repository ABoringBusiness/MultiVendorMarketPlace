
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#d6482b] text-white py-8">
      <div className="container mx-auto px-5">
        {/* Top Section with Copyright */}
        <div className="text-center mb-4">
          <p className="text-base font-normal text-white">&copy; 2024 NelamiGhar. All Rights Reserved.</p>
        </div>
        <hr className="border-t border-white opacity-50 mb-6" />
        {/* Bottom Section with Links */}
        <div className="flex flex-wrap justify-center gap-8">
          <Link to="/about" className="text-sm text-white font-semibold hover:underline transition-all duration-300">
            About Us
          </Link>
          <Link to="/how-it-works-info" className="text-sm text-white font-semibold hover:underline transition-all duration-300">
            How It Works
          </Link>
          <Link to="/contact" className="text-sm text-white font-semibold hover:underline transition-all duration-300">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
