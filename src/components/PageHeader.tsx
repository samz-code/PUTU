export default function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-cocoa-700">{title}</h1>
        {subtitle && <p className="text-base text-slate-500 mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
