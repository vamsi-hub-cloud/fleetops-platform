import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Icon, PageHeader } from '../components/ui';
import { useApp } from '../store/AppContext';
import { cn, timeAgo } from '../lib/utils';
import type { NotifType } from '../types';

const TABS: [NotifType | 'all', string][] = [['all', 'All'], ['delay', 'Delayed shipments'], ['maintenance', 'Vehicles'], ['delivery', 'Deliveries'], ['driver', 'Drivers']];
const ICON: Record<NotifType, string> = { delay: 'clock', maintenance: 'wrench', delivery: 'box', driver: 'user' };
const SEV = { high: 'bg-red-50 text-red-600', medium: 'bg-amber-50 text-amber-700', low: 'bg-sky-50 text-sky-700' };

export default function Notifications() {
  const { notifications, unreadCount, markRead } = useApp();
  const [tab, setTab] = useState<NotifType | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const rows = notifications.filter((n) => (tab === 'all' || n.type === tab) && (!unreadOnly || !n.read));

  return (
    <>
      <PageHeader title="Alerts" subtitle={unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
        action={<Button variant="secondary" disabled={!unreadCount} onClick={() => markRead(notifications.map((n) => n.id))}><Icon name="check" className="h-4 w-4" />Mark all read</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={cn('rounded-full border px-3 py-1 text-xs font-medium', tab === k ? 'border-ink-800 bg-ink-800 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400')}>
            {l} · {k === 'all' ? notifications.length : notifications.filter((n) => n.type === k).length}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />Unread only</label>
      </div>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {rows.map((n) => (
            <li key={n.id} className={cn('flex items-start gap-3 px-4 py-3', !n.read && 'bg-brand-50/40')}>
              <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md', SEV[n.severity])}><Icon name={ICON[n.type]} className="h-4 w-4" /></span>
              <Link to={n.link} onClick={() => markRead([n.id])} className="min-w-0 flex-1">
                <p className={cn('text-sm', n.read ? 'text-slate-700' : 'font-semibold text-slate-900')}>{n.title}</p>
                <p className="text-sm text-slate-500">{n.body}</p>
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-1"><span className="text-xs text-slate-400">{timeAgo(n.at)}</span>{!n.read && <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => markRead([n.id])}>Mark read</button>}</div>
            </li>
          ))}
        </ul>
      ) : <div className="rounded-lg border border-slate-200 bg-white"><EmptyState icon="bell" title="No alerts here" message={unreadOnly ? 'Everything in this view has been read.' : 'Delays, maintenance and delivery updates will appear here as they happen.'} /></div>}
    </>
  );
}
