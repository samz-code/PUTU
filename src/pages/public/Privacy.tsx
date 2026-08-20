import { Link } from 'react-router-dom';
import {
  Database,
  Settings,
  Cookie,
  Share2,
  Lock,
  Clock,
  UserCheck,
  Baby,
  Globe,
  ExternalLink,
  RefreshCw,
  Mail,
} from 'lucide-react';

const LAST_UPDATED = 'August 20, 2026';

const SECTIONS = [
  { id: 'information-we-collect', label: 'Information We Collect', icon: Database },
  { id: 'how-we-use-it', label: 'How We Use It', icon: Settings },
  { id: 'cookies', label: 'Cookies & Tracking', icon: Cookie },
  { id: 'sharing', label: 'How We Share It', icon: Share2 },
  { id: 'security', label: 'Storage & Security', icon: Lock },
  { id: 'retention', label: 'Data Retention', icon: Clock },
  { id: 'your-rights', label: 'Your Rights', icon: UserCheck },
  { id: 'children', label: "Children's Privacy", icon: Baby },
  { id: 'transfers', label: 'International Transfers', icon: Globe },
  { id: 'third-party-links', label: 'Third-Party Links', icon: ExternalLink },
  { id: 'changes', label: 'Changes to This Policy', icon: RefreshCw },
  { id: 'contact', label: 'Contact Us', icon: Mail },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-8 border-b border-cocoa-100 last:border-none">
      <h2 className="text-xl sm:text-2xl font-semibold text-cocoa-900 mb-4">{title}</h2>
      <div className="text-cocoa-600 text-base leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-teal-700 text-white">
        <div className="page-container py-14 sm:py-20">
          <p className="text-coral-300 text-sm font-semibold tracking-wide uppercase mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">Privacy Policy</h1>
          <p className="text-sand-200 text-base sm:text-lg max-w-2xl">
            This explains what information Putu Travels collects when you plan or book a trip
            with us, how we use it, and the choices and rights you have over it.
          </p>
          <p className="text-sand-400 text-sm mt-5">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Mobile TOC — horizontal scroll chips */}
      <div className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-cocoa-100">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 whitespace-nowrap text-sm px-3 py-1.5 rounded-full border border-cocoa-100 text-cocoa-600 hover:border-coral-400 hover:text-coral-600 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="page-container py-10 sm:py-14 flex flex-col lg:flex-row gap-12">
        {/* Desktop sticky TOC */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="sticky top-28 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-400 mb-3">
              On this page
            </p>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="group flex items-center gap-2.5 py-1.5 text-sm text-cocoa-600 hover:text-coral-600 transition-colors"
              >
                <Icon size={15} className="shrink-0 text-cocoa-400 group-hover:text-coral-500 transition-colors" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <Section id="information-we-collect" title="Information We Collect">
            <p>We collect information you give us directly and some information collected automatically.</p>
            <p className="font-medium text-cocoa-800">Information you provide:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Name, email address, phone number, and postal address</li>
              <li>Passport or ID details required to confirm bookings with hotels, airlines, or transport partners</li>
              <li>Travel preferences, special requests, and itinerary details you share with our team</li>
              <li>Payment details, processed securely through our payment providers — we do not store full card numbers on our own servers</li>
              <li>Messages you send us through the site, WhatsApp, email, or the customer portal</li>
            </ul>
            <p className="font-medium text-cocoa-800">Information collected automatically:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Device, browser type, and approximate location (from IP address)</li>
              <li>Pages visited, links clicked, and time spent on the site</li>
              <li>Cookies and similar technologies, described below</li>
            </ul>
          </Section>

          <Section id="how-we-use-it" title="How We Use It">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Plan, confirm, and manage your bookings, transfers, and itineraries</li>
              <li>Communicate with you about your trip, including confirmations, changes, and support</li>
              <li>Process payments and prevent fraud</li>
              <li>Improve our site, services, and the experiences we curate</li>
              <li>Send occasional newsletters or offers, only if you've opted in, with an easy way to unsubscribe</li>
              <li>Meet legal, tax, and regulatory obligations</li>
            </ul>
          </Section>

          <Section id="cookies" title="Cookies & Tracking Technologies">
            <p>
              We use cookies and similar technologies to keep you logged in to the customer
              portal, remember your preferences, and understand how the site is used so we can
              improve it. You can control or disable cookies through your browser settings; some
              parts of the site, like the customer portal, may not work properly without them.
            </p>
          </Section>

          <Section id="sharing" title="How We Share It">
            <p>We do not sell your personal information. We share it only where it's needed to deliver your trip or run our business:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>With hotels, restaurants, drivers, and guides directly involved in fulfilling your booking</li>
              <li>With payment processors to complete transactions securely</li>
              <li>With service providers who support our operations, such as hosting or email delivery, under confidentiality obligations</li>
              <li>When required by law, regulation, or a valid legal request</li>
              <li>In connection with a business transfer, such as a merger or acquisition, with continued protection of your data</li>
            </ul>
          </Section>

          <Section id="security" title="Storage & Security">
            <p>
              We use industry-standard safeguards, including encrypted connections and access
              controls, to protect your information from unauthorized access, alteration, or
              loss. No system is completely secure, so we can't guarantee absolute security, but
              we work to keep your data protected and to respond quickly if something goes wrong.
            </p>
          </Section>

          <Section id="retention" title="Data Retention">
            <p>
              We keep personal information for as long as needed to provide our services, meet
              legal and tax obligations, resolve disputes, and enforce our agreements. When it's
              no longer needed, we securely delete or anonymize it.
            </p>
          </Section>

          <Section id="your-rights" title="Your Rights">
            <p>
              Under Kenya's Data Protection Act, 2019, and similar laws that may apply to you,
              you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data, subject to legal or contractual limits</li>
              <li>Object to or restrict certain processing</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Withdraw consent at any time, where processing is based on consent</li>
            </ul>
            <p>
              To exercise any of these rights, contact us using the details in the{' '}
              <a href="#contact" className="text-coral-600 hover:underline">
                Contact Us
              </a>{' '}
              section below.
            </p>
          </Section>

          <Section id="children" title="Children's Privacy">
            <p>
              Our services are not directed at children, and we don't knowingly collect personal
              information from anyone under 18. If you believe a child has provided us with
              personal information, please contact us so we can remove it.
            </p>
          </Section>

          <Section id="transfers" title="International Transfers">
            <p>
              Some of our service providers, such as hosting or payment processors, may store or
              process data outside Kenya. Where this happens, we take steps to ensure your
              information continues to receive an appropriate level of protection.
            </p>
          </Section>

          <Section id="third-party-links" title="Third-Party Links">
            <p>
              Our site may link to partner hotels, restaurants, or other third-party websites.
              We aren't responsible for their privacy practices, and we encourage you to review
              their policies before sharing information with them.
            </p>
          </Section>

          <Section id="changes" title="Changes to This Policy">
            <p>
              We may update this policy from time to time to reflect changes in our practices or
              for legal reasons. We'll update the "Last updated" date above, and for significant
              changes, we'll take reasonable steps to notify you.
            </p>
          </Section>

          <Section id="contact" title="Contact Us">
            <p>If you have questions about this policy or want to exercise your data rights, reach us at:</p>
            <ul className="space-y-1.5">
              <li>
                Email:{' '}
                <a href="mailto:putukenya06@gmail.com" className="text-coral-600 hover:underline">
                  putukenya06@gmail.com
                </a>
              </li>
              <li>
                Phone:{' '}
                <a href="tel:+254714446328" className="text-coral-600 hover:underline">
                  +254 714 446 328
                </a>
              </li>
              <li>Address: Diani, Kenya</li>
            </ul>
            <p className="pt-2">
              See also our{' '}
              <Link to="/terms" className="text-coral-600 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}