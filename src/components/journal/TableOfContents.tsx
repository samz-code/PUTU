import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import type { Heading } from '@/utils/journalContent';

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
    );

    const elements = headings
      .map(h => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  function scrollToHeading(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-sm space-y-3">
      <h3 className="font-serif font-bold text-cocoa-700 text-sm flex items-center gap-2">
        <List size={16} className="text-teal-700" /> In This Story
      </h3>
      <nav className="space-y-0.5" aria-label="Table of contents">
        {headings.map(h => (
          <button
            key={h.id}
            type="button"
            onClick={() => scrollToHeading(h.id)}
            className={[
              'block w-full text-left text-xs leading-relaxed transition-colors cursor-pointer py-1.5 border-l-2 -ml-px',
              h.level === 3 ? 'pl-6' : 'pl-3',
              activeId === h.id
                ? 'text-coral-600 font-semibold border-coral-600'
                : 'text-slate-600 hover:text-teal-700 border-transparent',
            ].join(' ')}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
