import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, Icon, Meter, PageHeader, Stat } from '../components/ui';
import { useApp } from '../store/AppContext';
import { cn, daysUntil, fmtDateTime, timeAgo } from '../lib/utils';

const DAY = 864e5;

export default function Dashboard() {
  const { vehicles, drivers, shipments, notifications } = useApp();

  const m = useMemo(() => {
    const count = (s: string) => shipments.filter((x) => x.status === s).length;
    const delivered = shipments.filter((s) => s.status === 'delivered' && s.deliveredAt);
    const onTime = delivered.filter((s) => new Date(s.deliveredAt!) <= new Date(s.eta)).length;
    const avgHours = delivered.length ? delivered.reduce((a, s) => a + (new Date(s.deliveredAt!).getTime() - new Date(s.createdAt).getTime()) / 3600e3, 0) / delivered.length : 0;
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * DAY);
      const key = d.toDateString();
      return {
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        created: shipments.filter((s) => new Date(s.createdAt).toDateString() === key).length,
        delivered: shipments.filter((s) => s.deliveredAt && new Date(s.deliveredAt).toDateString() === key).length,
      };
    });
    const byStatus = (st: string) => vehicles.filter((v) => v.status === st).length;
    return {
      delivered: count('delivered'), transit: count('in_transit'), delayed: count('delayed'), pending: count('pending'),
      onTimeRate: delivered.length ? Math.round((onTime / delivered.length) * 100) : 0, avgHours: Math.round(avgHours),
      days, max: Math.max(1, ...days.flatMap((d) => [d.created, d.delivered])),
      active: byStatus('active'), idle: byStatus('idle'), maint: byStatus('maintenance'), offline: byStatus('offline'),
      avgFuel: vehicles.length ? Math.round(vehicles.reduce((a, v) => a + v.fuelLevel, 0) / vehicles.length) : 0,
      serviceDue: vehicles.filter((v) => daysUntil(v.nextService) <= 7).length,
      rating: drivers.length ? (drivers.reduce((a, d) => a + d.rating, 0) / drivers.length).toFixed(1) : '–',
    };
  }, [vehicles, drivers, shipments]);

  const activity = useMemo(
    () => shipments.flatMap((s) => s.history.map((h) => ({ ...h, id: s.id, customer: s.customer }))).sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 7),
    [shipments],
  );

  const total = vehicles.length || 1;
  const bars: [string, number, string][] = [['Active', m.active, 'bg-emerald-500'], ['Idle', m.idle, 'bg-slate-400'], ['Maintenance', m.maint, 'bg-amber-500'], ['Offline', m.offline, 'bg-slate-700']];

  return (
    <>
      <PageHeader title="Operations overview" subtitle={`${m.transit + m.delayed} shipments on the road right now`} action={<Link to="/tracking" className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"><Icon name="map" className="h-4 w-4" />Open live map</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Vehicles" value={vehicles.length} hint={`${m.active} active · ${m.maint} in maintenance`} icon="truck" tone="brand" />
        <Stat label="Drivers" value={drivers.length} hint={`${drivers.filter((d) => d.status === 'available').length} available now`} icon="user" tone="blue" />
        <Stat label="Active shipments" value={m.transit + m.delayed + m.pending} hint={`${m.pending} waiting for dispatch`} icon="box" tone="slate" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Delivered" value={m.delivered} icon="check" tone="green" />
        <Stat label="In transit" value={m.transit} icon="truck" tone="blue" />
        <Stat label="Delayed" value={m.delayed} icon="clock" tone="red" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Delivery performance" className="lg:col-span-2" action={<div className="flex gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-slate-300" />Created</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand-500" />Delivered</span></div>}>
          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
            <div><p className="text-xs text-slate-500">On-time rate</p><p className="text-xl font-semibold">{m.onTimeRate}%</p></div>
            <div><p className="text-xs text-slate-500">Avg. door to door</p><p className="text-xl font-semibold">{m.avgHours} h</p></div>
            <div><p className="text-xs text-slate-500">Avg. driver rating</p><p className="text-xl font-semibold">{m.rating}</p></div>
          </div>
          <div className="mt-4 flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="Shipments created and delivered per day for the last 7 days">
            {m.days.map((d) => (
              <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                <div className="flex flex-1 items-end justify-center gap-1">
                  <div className="w-full max-w-5 rounded-t bg-slate-300" style={{ height: `${(d.created / m.max) * 100}%` }} title={`${d.created} created`} />
                  <div className="w-full max-w-5 rounded-t bg-brand-500" style={{ height: `${(d.delivered / m.max) * 100}%` }} title={`${d.delivered} delivered`} />
                </div>
                <span className="text-center text-xs text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Fleet performance">
          <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {bars.map(([l, n, c]) => <div key={l} className={c} style={{ width: `${(n / total) * 100}%` }} title={`${l}: ${n}`} />)}
          </div>
          <ul className="space-y-2 text-sm">
            {bars.map(([l, n, c]) => <li key={l} className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><i className={cn('h-2.5 w-2.5 rounded-full', c)} />{l}</span><span className="font-medium tabular-nums">{n}</span></li>)}
          </ul>
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div><div className="mb-1 flex justify-between"><span className="text-slate-600">Utilisation</span><span className="font-medium">{Math.round((m.active / total) * 100)}%</span></div><Meter value={(m.active / total) * 100} tone="blue" /></div>
            <div><div className="mb-1 flex justify-between"><span className="text-slate-600">Average fuel level</span><span className="font-medium">{m.avgFuel}%</span></div><Meter value={m.avgFuel} /></div>
            <p className="text-slate-600"><span className="font-medium text-slate-900">{m.serviceDue}</span> vehicle{m.serviceDue === 1 ? '' : 's'} due or overdue for service within 7 days</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Alerts" action={<Link to="/notifications" className="text-xs font-medium text-brand-600">View all</Link>} pad={false}>
          <ul className="divide-y divide-slate-100">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id}>
                <Link to={n.link} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.severity === 'high' ? 'bg-red-500' : n.severity === 'medium' ? 'bg-amber-500' : 'bg-sky-400')} />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-900">{n.title}</span><span className="block truncate text-xs text-slate-500">{n.body}</span></span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.at)}</span>
                </Link>
              </li>
            ))}
            {!notifications.length && <li className="px-4 py-8 text-center text-sm text-slate-500">No alerts. Everything is on schedule.</li>}
          </ul>
        </Card>
        <Card title="Recent activity" pad={false}>
          <ul className="divide-y divide-slate-100">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Badge status={a.status} />
                <span className="min-w-0 flex-1 text-sm"><Link to={`/shipments/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">{a.id}</Link> <span className="text-slate-500">· {a.customer}</span><span className="block truncate text-xs text-slate-500">{a.note}</span></span>
                <span className="shrink-0 text-xs text-slate-400" title={fmtDateTime(a.at)}>{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
