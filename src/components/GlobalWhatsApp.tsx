import { useLocation } from 'react-router-dom';
import WhatsAppFloat from '@/components/WhatsAppFloat';

// Staff-only dashboards — no customer-facing chat bubble needed here
const FULLY_HIDDEN_PREFIXES = ['/admin', '/partner'];

// Customer-facing but logged-in — show it, but fade it out after inactivity
// so it doesn't linger over dashboard UI. Reappears on scroll/mouse/touch.
const AUTO_HIDE_PREFIXES = ['/portal'];

/**
 * Renders the floating WhatsApp button globally:
 * - Public marketing pages: always visible, never auto-hides
 * - Customer portal: visible, fades out after a few seconds of inactivity
 * - Admin / partner dashboards: not rendered at all
 */
export default function GlobalWhatsApp() {
  const { pathname } = useLocation();

  const isFullyHidden = FULLY_HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (isFullyHidden) return null;

  const isAutoHide = AUTO_HIDE_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // autoHideDelay=0 disables auto-hide (marketing pages); portal uses the default idle delay
  return <WhatsAppFloat autoHideDelay={isAutoHide ? undefined : 0} />;
}