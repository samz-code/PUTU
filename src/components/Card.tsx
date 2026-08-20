import type { ReactNode } from 'react';

interface CardProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Clean, minimal content card used to break broad policy text into scannable sections. */
export default function Card({ icon, title, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-cocoa-100 bg-white p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-coral-200 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-teal-50 text-teal-700 shrink-0">
            {icon}
          </span>
        )}
        <h3 className="text-base sm:text-lg font-semibold text-cocoa-900">{title}</h3>
      </div>
      <div className="text-cocoa-600 text-sm leading-relaxed space-y-2.5">{children}</div>
    </div>
  );
}