import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn, humanize } from '../../lib/utils';
import { Icon } from './Icon';

export { Icon };

/* ---------- Button ---------- */
const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/50',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50',
  ghost: 'text-slate-600 hover:bg-slate-100',
};
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS; size?: 'sm' | 'md'; loading?: boolean;
};
export function Button({ variant = 'primary', size = 'md', loading, className, children, ...p }: ButtonProps) {
  return (
    <button
      type="button"
      {...p}
      disabled={p.disabled || loading}
      className={cn('inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm', VARIANTS[variant], className)}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

/* ---------- Badge ---------- */
const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
const STATUS_TONE: Record<string, keyof typeof TONES> = {
  active: 'green', idle: 'slate', maintenance: 'amber', offline: 'red',
  available: 'green', on_trip: 'blue', off_duty: 'slate', on_leave: 'amber',
  pending: 'slate', in_transit: 'blue', delivered: 'green', delayed: 'red', cancelled: 'slate',
};
export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[STATUS_TONE[status] ?? 'slate'])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? humanize(status)}
    </span>
  );
}

/* ---------- Layout bits ---------- */
export function Card({ title, action, children, className, pad = true }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, action, back }: { title: string; subtitle?: ReactNode; action?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <div className="mb-5">
      {back && (
        <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
          <Icon name="back" className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone = 'slate' }: { label: string; value: ReactNode; hint?: string; icon?: string; tone?: 'slate' | 'blue' | 'green' | 'red' | 'brand' }) {
  const iconTone = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-sky-50 text-sky-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', brand: 'bg-brand-50 text-brand-600' }[tone];
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {icon && <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-md', iconTone)}><Icon name={icon} /></span>}
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function Meter({ value, tone }: { value: number; tone?: 'green' | 'amber' | 'red' | 'blue' }) {
  const t = tone ?? (value < 20 ? 'red' : value < 40 ? 'amber' : 'green');
  const c = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-sky-500' }[t];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full', c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function DL({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ items }: { items: { at: string; title: string; note?: string; tone?: string }[] }) {
  return (
    <ol className="relative ml-2 border-l border-slate-200">
      {items.map((it, i) => (
        <li key={i} className="mb-4 ml-4 last:mb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-300" />
          <p className="text-sm font-medium text-slate-900">{it.title}</p>
          {it.note && <p className="text-sm text-slate-500">{it.note}</p>}
          <p className="text-xs text-slate-400">{it.at}</p>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Async states ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />;
}
export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-72" />
    </div>
  );
}
export function EmptyState({ title, message, action, icon = 'box' }: { title: string; message: string; action?: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500"><Icon name={icon} className="h-6 w-6" /></span>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md rounded-lg border border-red-200 bg-white p-6 text-center">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600"><Icon name="alert" className="h-6 w-6" /></span>
      <h3 className="font-semibold text-slate-900">Fleet data didn’t load</h3>
      <p className="mt-1 text-sm text-slate-500">{message}. Check your connection and try again.</p>
      <Button className="mt-4" onClick={onRetry}>Reload data</Button>
    </div>
  );
}

/* ---------- Form pieces ---------- */
export function Field({ label, error, required, children, hint }: { label: string; error?: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function FilterBar({ children, active, onReset, count, total }: { children: ReactNode; active: boolean; onReset: () => void; count: number; total: number }) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {count} of {total}</span>
        {active && <button onClick={onReset} className="font-medium text-brand-600 hover:underline">Clear filters</button>}
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={cn('flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><Icon name="x" className="h-5 w-5" /></button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onClose }: { open: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600">{message}</p>
      <ConfirmActions onConfirm={onConfirm} onClose={onClose} label={confirmLabel} />
    </Modal>
  );
}
import { useState } from 'react';
function ConfirmActions({ onConfirm, onClose, label }: { onConfirm: () => Promise<void>; onClose: () => void; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>Keep it</Button>
      <Button variant="danger" loading={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); onClose(); } }}>{label}</Button>
    </div>
  );
}
