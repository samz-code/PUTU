import React from 'react';
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
  FaPhone,
  FaEnvelope,
  FaLocationDot,
} from 'react-icons/fa6';

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/pututravels', icon: FaFacebookF },
  { name: 'Instagram', href: 'https://instagram.com/pututravels', icon: FaInstagram },
  { name: 'TikTok', href: 'https://tiktok.com/@pututravels', icon: FaTiktok },
  { name: 'X', href: 'https://x.com/pututravels', icon: FaXTwitter },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/pututravels', icon: FaLinkedinIn },
  { name: 'YouTube', href: 'https://youtube.com/@pututravels', icon: FaYoutube },
];

const PHONE = '+254 714 446 328';
const PHONE_HREF = 'tel:+254714446328';
const EMAIL = 'putukenya06@gmail.com';
const EMAIL_HREF = 'mailto:putukenya06@gmail.com';

export default function TopBar() {
  return (
    <div className="w-full bg-teal-700 text-white border-b border-white/10">
      <div className="flex sm:hidden flex-col items-center justify-center gap-1 py-1.5 px-4">
        <a
          href={PHONE_HREF}
          className="flex items-center gap-1.5 font-bold text-sm tracking-wide hover:text-blue-100 transition-colors duration-150 whitespace-nowrap"
        >
          <FaPhone size={13} />
          <span>{PHONE}</span>
        </a>
        <a
          href={EMAIL_HREF}
          className="flex items-center gap-1.5 font-medium text-xs tracking-wide text-white/85 hover:text-blue-100 transition-colors duration-150 whitespace-nowrap"
        >
          <FaEnvelope size={12} />
          <span>{EMAIL}</span>
        </a>
      </div>

      <div className="hidden sm:block page-container">
        <div className="grid grid-cols-3 items-center h-11">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide justify-self-start text-white/90 hover:text-blue-100 transition-colors duration-150 cursor-pointer">
            <FaLocationDot size={14} />
            <span>Diani, Kenyan Coast</span>
          </div>

          <div className="flex items-center gap-4 justify-self-center">
            <a
              href={PHONE_HREF}
              className="flex items-center gap-1.5 font-bold text-sm tracking-wide hover:text-blue-100 transition-colors duration-150 whitespace-nowrap"
            >
              <FaPhone size={14} />
              <span>{PHONE}</span>
            </a>
            <span className="hidden md:block h-4 w-px bg-white/25" aria-hidden="true" />
            <a
              href={EMAIL_HREF}
              className="hidden md:flex items-center gap-1.5 font-bold text-sm tracking-wide hover:text-blue-100 transition-colors duration-150 whitespace-nowrap"
            >
              <FaEnvelope size={14} />
              <span>{EMAIL}</span>
            </a>
          </div>

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