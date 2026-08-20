import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';

interface WhatsAppFloatProps {
  /** Phone number in international format, no + or spaces, e.g. "254714446328" */
  phone?: string;
  /** Pre-filled message opened in the chat */
  message?: string;
  /** Text shown in the hover tooltip */
  tooltip?: string;
  /** Ms of inactivity before the button fades out. Set to 0 to disable auto-hide. */
  autoHideDelay?: number;
  /** One-time greeting shown as a speech bubble a few seconds after the button appears */
  greeting?: string;
}

/**
 * Floating, animated WhatsApp button.
 * - Bounces in on first mount with a slight overshoot
 * - Gentle idle float, like it's bobbing on standby
 * - Staggered double sonar ring instead of a flat single ping
 * - Periodic hand-wave wiggle on the icon to catch the eye without being constant
 * - One-time speech-bubble greeting that pops itself open, then a regular hover tooltip after
 * - Fades out after a period of inactivity, reappears on scroll/mouse/touch
 * - All motion is skipped for prefers-reduced-motion
 */
export default function WhatsAppFloat({
  phone = '254714446328',
  message = "Hi Putu Travels, I'd like to know more about a trip.",
  tooltip = 'Chat with us on WhatsApp',
  autoHideDelay = 6000,
  greeting = '👋 Karibu! Planning a trip? Ask us anything.',
}: WhatsAppFloatProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [wiggling, setWiggling] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingSpent, setGreetingSpent] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const activityThrottled = useRef(false);
  const hovering = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handleChange);

    return () => {
      clearTimeout(t);
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  // One-time greeting bubble: pops open shortly after entrance, closes itself
  useEffect(() => {
    if (prefersReducedMotion || greetingSpent) return;
    const openT = setTimeout(() => setShowGreeting(true), 1800);
    const closeT = setTimeout(() => {
      setShowGreeting(false);
      setGreetingSpent(true);
    }, 7000);
    return () => {
      clearTimeout(openT);
      clearTimeout(closeT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  // Periodic attention wiggle on the icon — brief, then long rest, never during hover/tooltip/greeting
  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      if (hovering.current || showTooltip || showGreeting) return;
      setWiggling(true);
      setTimeout(() => setWiggling(false), 650);
    }, 9000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion, showTooltip, showGreeting]);

  // Idle auto-hide: fade out after autoHideDelay of no activity, reappear on interaction
  useEffect(() => {
    if (!autoHideDelay) return;

    const scheduleHide = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), autoHideDelay);
    };

    const handleActivity = () => {
      if (activityThrottled.current) return;
      activityThrottled.current = true;
      setVisible(true);
      scheduleHide();
      setTimeout(() => {
        activityThrottled.current = false;
      }, 300);
    };

    scheduleHide();

    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity, { passive: true });

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [autoHideDelay]);

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const entered = mounted && visible;
  const bubbleOpen = showGreeting || showTooltip;
  const bubbleText = showGreeting ? greeting : tooltip;

  return (
    <div
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-end transition-all duration-500 ${
        entered
          ? 'opacity-100 translate-y-0 scale-100 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
          : 'opacity-0 translate-y-4 scale-75 pointer-events-none ease-out'
      }`}
    >
      {/* Speech bubble: one-time greeting, then reverts to a plain hover tooltip */}
      <div
        role="status"
        className={`relative hidden sm:block mr-3 mb-1 rounded-2xl rounded-br-md bg-cocoa-900 text-white shadow-lg transition-all duration-300 origin-bottom-right ${
          bubbleOpen
            ? 'opacity-100 scale-100 translate-x-0'
            : 'opacity-0 scale-90 translate-x-2 pointer-events-none'
        } ${showGreeting ? 'max-w-[220px] px-4 py-3 text-sm leading-snug' : 'whitespace-nowrap px-3.5 py-2 text-sm font-medium'}`}
      >
        {bubbleText}
        <span className="absolute bottom-3 -right-1.5 w-3 h-3 bg-cocoa-900 rotate-45" />
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tooltip}
        onMouseEnter={() => {
          hovering.current = true;
          setShowTooltip(true);
          setVisible(true);
          if (hideTimer.current) clearTimeout(hideTimer.current);
        }}
        onMouseLeave={() => {
          hovering.current = false;
          setShowTooltip(false);
        }}
        onFocus={() => {
          setShowTooltip(true);
          setVisible(true);
          if (hideTimer.current) clearTimeout(hideTimer.current);
        }}
        onBlur={() => setShowTooltip(false)}
        onClick={() => {
          setShowGreeting(false);
          setGreetingSpent(true);
        }}
        className={`wa-fab-idle group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#25D366] to-[#1EBE5A] shadow-xl shadow-black/20 transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 ${
          prefersReducedMotion ? '' : 'wa-fab-float'
        }`}
      >
        {/* Staggered sonar rings */}
        {!prefersReducedMotion && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#25D366] wa-fab-ring" />
            <span className="absolute inset-0 rounded-full bg-[#25D366] wa-fab-ring wa-fab-ring-delay" />
          </>
        )}

        {/* Solid backing so the rings don't show through the icon */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#25D366] to-[#1EBE5A]" />

        <FaWhatsapp
          size={30}
          className={`relative text-white transition-transform duration-200 group-hover:rotate-[10deg] group-hover:scale-105 ${
            wiggling && !prefersReducedMotion ? 'wa-fab-wiggle' : ''
          }`}
        />

        {/* Online dot */}
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white">
          <span className="sr-only">Online</span>
        </span>
      </a>

      <style>{`
        @keyframes wa-fab-float-kf {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .wa-fab-float {
          animation: wa-fab-float-kf 3.4s ease-in-out infinite;
        }
        .wa-fab-float:hover {
          animation-play-state: paused;
        }

        @keyframes wa-fab-ring-kf {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .wa-fab-ring {
          animation: wa-fab-ring-kf 2.4s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
        }
        .wa-fab-ring-delay {
          animation-delay: 1.2s;
        }

        @keyframes wa-fab-wiggle-kf {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-14deg); }
          40% { transform: rotate(11deg); }
          60% { transform: rotate(-7deg); }
          80% { transform: rotate(4deg); }
        }
        .wa-fab-wiggle {
          animation: wa-fab-wiggle-kf 0.65s ease-in-out;
        }
      `}</style>
    </div>
  );
}