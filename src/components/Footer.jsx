import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-green-50 text-gray-700 w-full border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">RoadInspect AI</h2>
              <p className="text-green-600 text-sm font-medium">AI Road Damage Detection</p>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Automated road inspection technology powered by artificial intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-gray-600 hover:text-green-600 transition-colors">
                  Damage Detection
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-600 hover:text-green-600 transition-colors">
                  Severity Analysis
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-600 hover:text-green-600 transition-colors">
                  Maintenance Planning
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-green-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-green-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Connect</h3>
            <div className="flex space-x-3 mb-4">
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <Instagram size={18} />
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Email: info@roadinspect.ai
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-50 py-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex justify-center md:justify-between items-center">
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} RoadInspect AI. All rights reserved.
          </div>
          
          <div className="hidden md:block text-xs text-gray-400">
            Powered by AI for smarter road maintenance
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
