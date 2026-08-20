import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Phone, Mail, MapPin, ChevronDown, ArrowRight, Send, Check, AlertCircle } from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaLinkedinIn,
  FaYoutube,
} from 'react-icons/fa6';

type SectionKey = 'explore' | 'company' | 'contact' | 'newsletter';

interface FooterSectionProps {
  title: string;
  sectionKey: SectionKey;
  openSection: SectionKey | null;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/pututravels', icon: FaFacebookF },
  { name: 'Instagram', href: 'https://instagram.com/pututravels', icon: FaInstagram },
  { name: 'TikTok', href: 'https://tiktok.com/@pututravels', icon: FaTiktok },
  { name: 'X', href: 'https://x.com/pututravels', icon: FaXTwitter },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/pututravels', icon: FaLinkedinIn },
  { name: 'YouTube', href: 'https://youtube.com/@pututravels', icon: FaYoutube },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared arrow-hover treatment for any footer list item — internal route link */
function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="group flex items-center gap-1.5 hover:text-white transition-colors">
      <ArrowRight
        size={13}
        className="shrink-0 -ml-4 opacity-0 -translate-x-1 group-hover:ml-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-coral-400"
      />
      <span>{children}</span>
    </Link>
  );
}

/** Same arrow-hover treatment for external / non-router links (tel, mailto, http) */
function FooterExternalLink({
  href,
  icon: LeadingIcon,
  children,
  ...anchorProps
}: {
  href: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} className="group flex items-center gap-2.5 hover:text-white transition-colors" {...anchorProps}>
      {LeadingIcon && <LeadingIcon size={15} className="text-coral-400 shrink-0" />}
      <span className="flex items-center gap-1.5">
        <ArrowRight
          size={13}
          className="shrink-0 -ml-4 opacity-0 -translate-x-1 group-hover:ml-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-coral-400"
        />
        <span>{children}</span>
      </span>
    </a>
  );
}

/** Accordion wrapper: collapsible on mobile (< sm), always-open static column from sm up. */
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
        <div className="pb-4 sm:pb-0">{children}</div>
      </div>
    </div>
  );
}

/** Compact newsletter signup. Content only — accordion chrome is provided by FooterSection on mobile. */
function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus('error');
      setErrorMsg('Enter a valid email.');
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert([{ email: trimmed, source: 'footer' }]);
      if (error) {
        if (error.code === '23505') {
          setStatus('error');
          setErrorMsg("Already subscribed — thank you!");
          return;
        }
        throw error;
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      console.error('Newsletter signup error:', err);
      setStatus('error');
      setErrorMsg('Something went wrong.');
    }
  }

  return (
    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
      <p className="text-sand-400 text-sm mb-3 max-w-[220px]">
        Coastal guides &amp; new escapes, occasionally.
      </p>

      {status === 'success' ? (
        <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
          <Check size={14} /> Subscribed — welcome!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 w-full max-w-[220px]" noValidate>
          <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
          <input
            id="footer-newsletter-email"
            type="email"
            required
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="you@example.com"
            className="min-w-0 flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-sand-400 focus:outline-none focus:border-coral-400"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-label="Subscribe"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-coral-500 hover:bg-coral-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
          >
            <Send size={13} />
          </button>
        </form>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-1.5 text-rose-300 text-xs mt-1.5">
          <AlertCircle size={12} /> {errorMsg}
        </div>
      )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link to="/" className="mb-4 sm:mb-5">
              <img
                src="/logofooter.png"
                alt="Putu Travels"
                className="h-16 sm:h-24 lg:h-28 w-auto object-contain"
              />
            </Link>
            <p className="text-base leading-relaxed text-sand-400 max-w-xs">
              One trusted contact. Every detail handled. Curated luxury travel on the Kenyan coast.
            </p>

            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-sand-400/30 text-sand-300 hover:text-white hover:border-white hover:bg-white/10 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <FooterSection
              title="Explore"
              sectionKey="explore"
              openSection={openSection}
              onToggle={handleToggle}
            >
              <ul className="space-y-3 text-base">
                <li><FooterLink to="/experiences">Experiences</FooterLink></li>
                <li><FooterLink to="/accommodation">Accommodation</FooterLink></li>
                <li><FooterLink to="/transfers">Private Transfers</FooterLink></li>
                <li><FooterLink to="/concierge">Concierge</FooterLink></li>
                <li><FooterLink to="/destinations">Destinations</FooterLink></li>
                <li><FooterLink to="/planner">Journey Planner</FooterLink></li>
              </ul>
            </FooterSection>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <FooterSection
              title="Company"
              sectionKey="company"
              openSection={openSection}
              onToggle={handleToggle}
            >
              <ul className="space-y-3 text-base">
                <li><FooterLink to="/about">About Us</FooterLink></li>
                <li><FooterLink to="/partners">Partners</FooterLink></li>
                <li><FooterLink to="/journal">Journal</FooterLink></li>
                <li><FooterLink to="/her-turn">Her Turn</FooterLink></li>
                <li><FooterLink to="/contact">Contact</FooterLink></li>
                <li><FooterLink to="/portal">Customer Portal</FooterLink></li>
              </ul>
            </FooterSection>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <FooterSection
              title="Contact"
              sectionKey="contact"
              openSection={openSection}
              onToggle={handleToggle}
            >
              <ul className="space-y-3 text-base">
                <li>
                  <FooterExternalLink href="tel:+254714446328" icon={Phone}>
                    +254 714 446 328
                  </FooterExternalLink>
                </li>
                <li>
                  <FooterExternalLink href="mailto:putukenya06@gmail.com" icon={Mail}>
                    putukenya06@gmail.com
                  </FooterExternalLink>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin size={15} className="text-coral-400 shrink-0" />
                  <span>Diani, Kenya</span>
                </li>
              </ul>
            </FooterSection>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <FooterSection
              title="Newsletter"
              sectionKey="newsletter"
              openSection={openSection}
              onToggle={handleToggle}
            >
              <FooterNewsletter />
            </FooterSection>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-cocoa-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-sand-500 text-center sm:text-left">
            <p className="whitespace-nowrap">© {new Date().getFullYear()} Putu Travels. All rights reserved.</p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-sand-600">•</span>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-sand-600">•</span>
              <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            </div>

            <a
              href="https://www.emonisamuel.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap text-sand-600 hover:text-white transition-colors"
            >
              Engineered by Emoni Samuel
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}