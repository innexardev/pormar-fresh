'use client';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between xl:hidden">
      {/* Mobile: title shown in header bar — optional subtitle only */}
      {description && <p className="text-sm text-stone-500">{description}</p>}
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function PageHeaderDesktop({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 hidden xl:flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'fresh',
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'fresh' | 'amber' | 'sky' | 'violet' | 'rose';
}) {
  const accents = {
    fresh: 'from-fresh-500/10 to-white border-fresh-200 text-fresh-700',
    amber: 'from-amber-500/10 to-white border-amber-200 text-amber-700',
    sky: 'from-sky-500/10 to-white border-sky-200 text-sky-700',
    violet: 'from-violet-500/10 to-white border-violet-200 text-violet-700',
    rose: 'from-rose-500/10 to-white border-rose-200 text-rose-700',
  };

  return (
    <div className={`admin-card border bg-gradient-to-br ${accents[accent]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`admin-card ${className}`}>
      {title && <h2 className="mb-4 font-display text-base font-semibold text-stone-900 sm:text-lg">{title}</h2>}
      {children}
    </section>
  );
}

export function MobileSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[92dvh] flex-col rounded-t-3xl bg-white shadow-2xl safe-bottom lg:hidden animate-drawer-up">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-stone-900">{title ?? 'Detalhes'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </div>
    </>
  );
}

export function QuickActionGrid({ items }: { items: Array<{ href: string; label: string; icon: React.ReactNode; desc?: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:hidden">
      {items.map((item) => (
        <a key={item.href} href={item.href} className="quick-action">
          <span className="quick-action-icon">{item.icon}</span>
          <span className="text-sm font-semibold text-stone-900">{item.label}</span>
          {item.desc && <span className="text-xs text-stone-500">{item.desc}</span>}
        </a>
      ))}
    </div>
  );
}
