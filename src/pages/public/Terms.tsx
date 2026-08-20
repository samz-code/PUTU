import { Link } from 'react-router-dom';
import {
  FileCheck,
  Compass,
  CreditCard,
  Undo2,
  UserCog,
  Handshake,
  Copyright,
  ShieldAlert,
  Scale,
  Gavel,
  RefreshCw,
  Mail,
} from 'lucide-react';
import Card from '@/components/Card';

const LAST_UPDATED = 'August 20, 2026';

export default function Terms() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-teal-700 text-white">
        <div className="page-container py-14 sm:py-20">
          <p className="text-coral-300 text-sm font-semibold tracking-wide uppercase mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">Terms of Service</h1>
          <p className="text-sand-200 text-base sm:text-lg max-w-2xl">
            The broad strokes of how things work when you plan or book a trip with Putu
            Travels — kept plain and readable, not buried in fine print.
          </p>
          <p className="text-sand-400 text-sm mt-5">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="page-container py-12 sm:py-16">
        <p className="text-cocoa-500 text-sm max-w-2xl mb-10">
          By using our website or booking a trip through Putu Travels, you agree to the terms
          below. If something here doesn't sit right with you, reach out before booking —
          we're happy to talk it through.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <Card icon={<FileCheck size={18} />} title="Acceptance of Terms">
            <p>
              Using our site or booking through us means you accept these terms. If you're
              booking on behalf of a group or another person, you're confirming you have their
              authority to agree on their behalf.
            </p>
          </Card>

          <Card icon={<Compass size={18} />} title="Who We Are & Our Services">
            <p>
              Putu Travels is a curated travel concierge based in Diani, Kenya. We arrange
              experiences, accommodation, private transfers, and concierge services, often
              working with independent hotels, restaurants, drivers, and guides on your behalf.
            </p>
          </Card>

          <Card icon={<CreditCard size={18} />} title="Bookings & Payments">
            <p>
              Bookings are confirmed once payment or a deposit is received, and prices may
              change until then. We work with secure third-party processors for payments — we
              never store your full card details ourselves.
            </p>
          </Card>

          <Card icon={<Undo2 size={18} />} title="Cancellations, Changes & Refunds">
            <p>
              Cancellation and refund terms vary by service and partner — hotels, airlines, and
              tour operators each set their own policies. We'll always share the specific terms
              for your booking before you pay, and help you navigate changes where we can.
            </p>
          </Card>

          <Card icon={<UserCog size={18} />} title="Your Responsibilities">
            <p>
              You're responsible for giving us accurate travel details, valid documents (like
              passports or visas), and for your own conduct during any booked activity. Please
              arrive on time and follow the safety guidance of our partners and guides.
            </p>
          </Card>

          <Card icon={<Handshake size={18} />} title="Third-Party Services & Partners">
            <p>
              Many services — accommodation, dining, transport, activities — are delivered by
              independent partners. We vet who we work with, but each partner is responsible for
              their own service, and their own terms may also apply.
            </p>
          </Card>

          <Card icon={<Copyright size={18} />} title="Intellectual Property">
            <p>
              The content on this site — text, photos, design, and branding — belongs to Putu
              Travels or our licensors. You're welcome to share links to it, but please don't
              copy or reuse it commercially without asking us first.
            </p>
          </Card>

          <Card icon={<ShieldAlert size={18} />} title="Limitation of Liability">
            <p>
              We work hard to make sure every trip goes smoothly, but we can't be held
              responsible for circumstances outside our control — weather, third-party service
              failures, travel disruptions, or events like natural disasters or civil unrest.
            </p>
          </Card>

          <Card icon={<Gavel size={18} />} title="Indemnification">
            <p>
              You agree to cover us for any losses or claims that arise from your misuse of our
              services, violation of these terms, or breach of a partner's own policies during
              your trip.
            </p>
          </Card>

          <Card icon={<Scale size={18} />} title="Governing Law & Disputes">
            <p>
              These terms are governed by the laws of Kenya. If a disagreement comes up, we'd
              rather resolve it directly and in good faith — reach out and we'll work with you to
              find a fair outcome.
            </p>
          </Card>

          <Card icon={<RefreshCw size={18} />} title="Changes to These Terms">
            <p>
              We may update these terms occasionally as our services evolve. We'll update the
              date above when we do, and continuing to use the site after changes means you
              accept the updated terms.
            </p>
          </Card>

          <Card icon={<Mail size={18} />} title="Contact Us">
            <p>
              Questions about these terms? Reach us at{' '}
              <a href="mailto:putukenya06@gmail.com" className="text-coral-600 hover:underline">
                putukenya06@gmail.com
              </a>{' '}
              or{' '}
              <a href="tel:+254714446328" className="text-coral-600 hover:underline">
                +254 714 446 328
              </a>
              .
            </p>
          </Card>
        </div>

        <p className="text-cocoa-400 text-sm mt-10">
          See also our{' '}
          <Link to="/privacy" className="text-coral-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}