import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-green-50 text-gray-700 px-6 py-10 w-full">
      <div className="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Solutions */}
        <div>
          <h3 className="text-lg font-bold text-black mb-4">Solutions</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-black">Analytics</a></li>
            <li><a href="#" className="hover:text-black">Insights</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-lg font-bold text-black mb-4">Company</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-black">About</a></li>
            <li><a href="#" className="hover:text-black">News</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-bold text-black mb-4">Support</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-black">Documentation</a></li>
            <li><a href="#" className="hover:text-black">API Status</a></li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h3 className="text-lg font-bold text-black mb-4">Follow Us</h3>
          <div className="flex gap-4 text-xl text-black">
            <a href="#" className="hover:text-blue-600"><FaFacebookF /></a>
            <a href="#" className="hover:text-sky-400"><FaTwitter /></a>
            <a href="#" className="hover:text-blue-700"><FaLinkedinIn /></a>
            <a href="#" className="hover:text-pink-500"><FaInstagram /></a>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Inspectify. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
