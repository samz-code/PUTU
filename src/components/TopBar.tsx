import React from 'react';
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
  FaPhone,
  FaLocationDot,
} from 'react-icons/fa6';

/**
 * Utility bar above the main nav with #5F89DF background.
 *
 * Mobile (< sm):  phone number ONLY, centered. No location, no social icons.
 * Desktop (sm+):  3-column balanced row using the same `page-container` as the
 * logo/nav below it, so "Location" lines up directly with the
 * logo instead of sitting flush against the browser edge.
 * left   → location with MapPin icon
 * center → phone number
 * right  → social brand icons (Facebook, Instagram, TikTok, X, LinkedIn, YouTube) with hover background effects
 */

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/pututravels', icon: FaFacebookF },
  { name: 'Instagram', href: 'https://instagram.com/pututravels', icon: FaInstagram },
  { name: 'TikTok', href: 'https://tiktok.com/@pututravels', icon: FaTiktok },
  { name: 'X', href: 'https://x.com/pututravels', icon: FaXTwitter },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/pututravels', icon: FaLinkedinIn },
  { name: 'YouTube', href: 'https://youtube.com/@pututravels', icon: FaYoutube },
];

export default function TopBar() {
  return (
    <div className="w-full bg-[#5F89DF] text-white border-b border-white/10">
      {/* Mobile (< sm): phone number only, centered */}
      <div className="flex sm:hidden items-center justify-center h-9 px-4">
        <a
          href="tel:+254714446328"
          className="flex items-center gap-1.5 font-bold text-sm tracking-wide hover:text-blue-100 transition-colors duration-150 whitespace-nowrap"
        >
          <FaPhone size={13} />
          <span>+254 714 446 328</span>
        </a>
      </div>

      {/* Desktop / tablet (sm+): 3-column balanced row */}
      <div className="hidden sm:block page-container">
        <div className="grid grid-cols-3 items-center h-11">
          {/* Left: location */}
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide justify-self-start text-white/90 hover:text-blue-100 transition-colors duration-150 cursor-pointer">
            <FaLocationDot size={14} />
            <span>Diani, Kenyan Coast</span>
          </div>

          {/* Center: phone */}
          <a
            href="tel:+254714446328"
            className="flex items-center gap-1.5 font-bold text-sm tracking-wide hover:text-blue-100 transition-colors duration-150 whitespace-nowrap justify-self-center"
          >
            <FaPhone size={14} />
            <span>+254 714 446 328</span>
          </a>

          {/* Right: social brand icons with rounded background hover badges */}
          <div className="flex items-center gap-1 justify-self-end">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-all duration-150 flex items-center justify-center"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}