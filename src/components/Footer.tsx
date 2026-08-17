import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-cocoa-700 text-sand-200 mt-20">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1 flex flex-col items-start">
            <Link to="/" className="mb-5 -ml-2">
              <img
                src="/logo.png"
                alt="Putu Travels"
                className="h-28 sm:h-32 md:h-36 lg:h-40 w-auto object-contain"
              />
            </Link>
            <p className="text-base leading-relaxed text-sand-400">
              One trusted contact. Every detail handled. Curated luxury travel on the Kenyan coast.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/experiences" className="hover:text-white transition-colors">Experiences</Link></li>
              <li><Link to="/accommodation" className="hover:text-white transition-colors">Accommodation</Link></li>
              <li><Link to="/transfers" className="hover:text-white transition-colors">Private Transfers</Link></li>
              <li><Link to="/destinations" className="hover:text-white transition-colors">Destinations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-base">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/partners" className="hover:text-white transition-colors">Partners</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/portal" className="hover:text-white transition-colors">Customer Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-base">
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-coral-400" /> +254 714 446 328
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-coral-400" /> putukenya06@gmail.com
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={15} className="text-coral-400" /> Diani, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cocoa-800 flex flex-col sm:flex-row justify-between gap-3 text-sm text-sand-500">
          <p>Putu Travels Concierge Management System. All rights reserved.</p>
          <a href="https://www.pututravels.com" className="text-sm text-sand-500 hover:text-white transition-colors">www.pututravels.com</a>
        </div>
      </div>
    </footer>
  );
}