import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ChevronDown } from 'lucide-react';

type SectionKey = 'explore' | 'company' | 'contact';

interface FooterSectionProps {
  title: string;
  sectionKey: SectionKey;
  openSection: SectionKey | null;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}

function FooterSection({ title, sectionKey, openSection, onToggle, children }: FooterSectionProps) {
  const isOpen = openSection === sectionKey;

  return (
    <div className="border-b border-cocoa-800/40 sm:border-none">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-4 sm:py-0 sm:pointer-events-none sm:mb-4"
      >
        <h4 className="text-base font-semibold text-white">{title}</h4>
        <ChevronDown
          size={18}
          className={`text-sand-400 transition-transform duration-200 sm:hidden ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 sm:!max-h-none sm:!opacity-100 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 sm:opacity-100'
        }`}
      >
        <ul className="space-y-3 text-base pb-4 sm:pb-0">{children}</ul>
      </div>
    </div>
  );
}

export default function Footer() {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const handleToggle = (key: SectionKey) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <footer className="bg-teal-700 text-sand-200 mt-20">
      <div className="page-container py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link to="/" className="-ml-2 -mb-1 sm:mb-0 md:mb-1">
              <img
                src="/logofooter.png"
                alt="Putu Travels"
                className="h-24 sm:h-32 md:h-36 lg:h-40 w-auto object-contain"
              />
            </Link>
            <p className="text-base leading-relaxed text-sand-400 max-w-xs">
              One trusted contact. Every detail handled. Curated luxury travel on the Kenyan coast.
            </p>
          </div>

          <FooterSection
            title="Explore"
            sectionKey="explore"
            openSection={openSection}
            onToggle={handleToggle}
          >
            <li>
              <Link to="/experiences" className="hover:text-white transition-colors">
                Experiences
              </Link>
            </li>
            <li>
              <Link to="/accommodation" className="hover:text-white transition-colors">
                Accommodation
              </Link>
            </li>
            <li>
              <Link to="/transfers" className="hover:text-white transition-colors">
                Private Transfers
              </Link>
            </li>
            <li>
              <Link to="/concierge" className="hover:text-white transition-colors">
                Concierge
              </Link>
            </li>
            <li>
              <Link to="/destinations" className="hover:text-white transition-colors">
                Destinations
              </Link>
            </li>
            <li>
              <Link to="/planner" className="hover:text-white transition-colors">
                Journey Planner
              </Link>
            </li>
          </FooterSection>

          <FooterSection
            title="Company"
            sectionKey="company"
            openSection={openSection}
            onToggle={handleToggle}
          >
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/partners" className="hover:text-white transition-colors">
                Partners
              </Link>
            </li>
            <li>
              <Link to="/journal" className="hover:text-white transition-colors">
                Journal
              </Link>
            </li>
            <li>
              <Link to="/her-turn" className="hover:text-white transition-colors">
                Her Turn
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/portal" className="hover:text-white transition-colors">
                Customer Portal
              </Link>
            </li>
          </FooterSection>

          <FooterSection
            title="Contact"
            sectionKey="contact"
            openSection={openSection}
            onToggle={handleToggle}
          >
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="text-coral-400 shrink-0" />
              <a href="tel:+254714446328" className="hover:text-white transition-colors">
                +254 714 446 328
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="text-coral-400 shrink-0" />
              <a href="mailto:putukenya06@gmail.com" className="hover:text-white transition-colors">
                putukenya06@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={15} className="text-coral-400 shrink-0" />
              <span>Diani, Kenya</span>
            </li>
          </FooterSection>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 border-t border-cocoa-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-sand-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Putu Travels. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <a
              href="https://www.pututravels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sand-500 hover:text-white transition-colors"
            >
              www.pututravels.com
            </a>
            <span className="hidden sm:inline text-sand-600">|</span>
            <a
              href="https://www.emonisamuel.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sand-500 hover:text-white transition-colors"
            >
              Engineered by Emoni Samuel
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}