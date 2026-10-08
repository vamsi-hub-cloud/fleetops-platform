import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Icon, PageSkeleton, ErrorState } from '../ui';
import { cn, timeAgo } from '../../lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/tracking', label: 'Live tracking', icon: 'map' },
  { to: '/shipments', label: 'Shipments', icon: 'box' },
  { to: '/vehicles', label: 'Vehicles', icon: 'truck' },
  { to: '/drivers', label: 'Drivers', icon: 'user' },
  { to: '/notifications', label: 'Alerts', icon: 'bell' },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const { status, error, reload, unreadCount, notifications, markRead } = useApp();
  const loc = useLocation();
  useEffect(() => { setOpen(false); setBell(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 text-slate-300 transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-500 text-white"><Icon name="truck" /></span>
          <span className="text-lg font-semibold tracking-tight text-white">FleetOps</span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-ink-700 text-white shadow-[inset_3px_0_0_#fb923c]' : 'hover:bg-ink-800 hover:text-white')}>
              <Icon name={n.icon} className="h-[18px] w-[18px]" />
              <span className="flex-1">{n.label}</span>
              {n.to === '/notifications' && unreadCount > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">{unreadCount}</span>}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-xs text-slate-500">Dispatch console · mock data</p>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="flex-1" />
          <div className="relative">
            <button onClick={() => setBell((b) => !b)} className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={bell}>
              <Icon name="bell" />
              {unreadCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
            </button>
            {bell && (
              <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <span className="text-sm font-semibold">Recent alerts</span>
                  {unreadCount > 0 && <button className="text-xs font-medium text-brand-600" onClick={() => markRead(notifications.map((n) => n.id))}>Mark all read</button>}
                </div>
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <li key={n.id}>
                      <Link to={n.link} onClick={() => markRead([n.id])} className="block px-4 py-2.5 hover:bg-slate-50">
                        <p className={cn('text-sm', n.read ? 'text-slate-600' : 'font-semibold text-slate-900')}>{n.title}</p>
                        <p className="text-xs text-slate-400">{timeAgo(n.at)}</p>
                      </Link>
                    </li>
                  ))}
                  {!notifications.length && <li className="px-4 py-6 text-center text-sm text-slate-500">You’re all caught up.</li>}
                </ul>
                <Link to="/notifications" className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-slate-50">View all alerts</Link>
              </div>
            )}
          </div>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-800 text-xs font-semibold text-white" title="Dispatcher">DP</span>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6">
          {status === 'loading' ? <PageSkeleton /> : status === 'error' ? <ErrorState message={error ?? 'Unknown error'} onRetry={reload} /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
