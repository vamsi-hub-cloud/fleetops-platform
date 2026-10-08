import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, ConfirmDialog, EmptyState, FilterBar, FilterSelect, Icon, Meter, PageHeader, SearchInput } from '../components/ui';
import { DataTable, type Column } from '../components/ui/DataTable';
import { ShipmentFormModal } from '../components/forms/ShipmentFormModal';
import { useApp } from '../store/AppContext';
import { CITY_NAMES } from '../lib/geo';
import { cn, fmtDateTime, humanize } from '../lib/utils';
import type { Shipment } from '../types';

const blank = { q: '', status: '', driver: '', vehicle: '', location: '', from: '', to: '' };
const STATUSES = ['pending', 'in_transit', 'delayed', 'delivered', 'cancelled'];

export default function Shipments() {
  const { shipments, drivers, vehicles, removeShipment } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState<Shipment | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Shipment | undefined>();
  const name = (id?: string) => drivers.find((d) => d.id === id)?.name;
  const plate = (id?: string) => vehicles.find((v) => v.id === id)?.plate;

  const rows = useMemo(() => shipments.filter((s) => {
    const q = f.q.trim().toLowerCase();
    if (q && ![s.id, s.customer, s.customerPhone, s.cargo].some((x) => x.toLowerCase().includes(q))) return false;
    if (f.status && s.status !== f.status) return false;
    if (f.driver && s.driverId !== f.driver) return false;
    if (f.vehicle && s.vehicleId !== f.vehicle) return false;
    if (f.location && s.origin !== f.location && s.destination !== f.location) return false;
    if (f.from && s.createdAt.slice(0, 10) < f.from) return false;
    if (f.to && s.createdAt.slice(0, 10) > f.to) return false;
    return true;
  }), [shipments, f]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, shipments.filter((x) => x.status === s).length])), [shipments]);

  const cols: Column<Shipment>[] = [
    { key: 'i', header: 'Shipment', render: (s) => <div><p className="font-medium text-slate-900">{s.id}</p><p className="text-xs text-slate-500">{s.customer}</p></div> },
    { key: 'r', header: 'Route', render: (s) => <span className="whitespace-nowrap">{s.origin} <span className="text-slate-400">→</span> {s.destination}</span> },
    { key: 's', header: 'Status', render: (s) => <Badge status={s.status} /> },
    { key: 'p', header: 'Progress', hide: 'sm', render: (s) => <div className="w-24"><Meter value={s.progress} tone={s.status === 'delayed' ? 'red' : s.status === 'delivered' ? 'green' : 'blue'} /></div> },
    { key: 'd', header: 'Driver · vehicle', hide: 'lg', render: (s) => <div className="text-xs"><p className="text-slate-700">{name(s.driverId) ?? 'No driver'}</p><p className="text-slate-400">{plate(s.vehicleId) ?? 'No vehicle'}</p></div> },
    { key: 'e', header: 'ETA', hide: 'md', render: (s) => <span className="whitespace-nowrap">{fmtDateTime(s.eta)}</span> },
    { key: 'a', header: '', align: 'right', render: (s) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" aria-label={`Edit ${s.id}`} onClick={() => setEditing(s)}><Icon name="edit" className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Delete ${s.id}`} className="text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)}><Icon name="trash" className="h-4 w-4" /></Button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Shipments" subtitle="Create, dispatch and follow every consignment" action={<Button onClick={() => setCreating(true)}><Icon name="plus" className="h-4 w-4" />New shipment</Button>} />
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Quick status filter">
        {[['', 'All', shipments.length] as const, ...STATUSES.map((s) => [s, humanize(s), counts[s]] as const)].map(([v, l, n]) => (
          <button key={v} onClick={() => setF({ ...f, status: v })} aria-pressed={f.status === v}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', f.status === v ? 'border-ink-800 bg-ink-800 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400')}>{l} · {n}</button>
        ))}
      </div>
      <FilterBar active={JSON.stringify({ ...f, status: '' }) !== JSON.stringify({ ...blank, status: '' }) || !!f.status} onReset={() => setF(blank)} count={rows.length} total={shipments.length}>
        <SearchInput value={f.q} onChange={(q) => setF({ ...f, q })} placeholder="Search ID, customer or cargo" />
        <FilterSelect label="Any driver" value={f.driver} onChange={(driver) => setF({ ...f, driver })} options={drivers.map((d) => [d.id, d.name])} />
        <FilterSelect label="Any vehicle" value={f.vehicle} onChange={(vehicle) => setF({ ...f, vehicle })} options={vehicles.map((v) => [v.id, v.plate])} />
        <FilterSelect label="Pickup or delivery in…" value={f.location} onChange={(location) => setF({ ...f, location })} options={CITY_NAMES.map((c) => [c, c])} />
        <label className="flex items-center gap-2 text-xs text-slate-500">From<input type="date" className="input" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-xs text-slate-500">To<input type="date" className="input" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
      </FilterBar>
      <DataTable rows={rows} columns={cols} onRowClick={(s) => nav(`/shipments/${s.id}`)}
        empty={shipments.length ? <EmptyState icon="search" title="No shipments match these filters" message="Widen the date range or clear a filter to see more." action={<Button variant="secondary" onClick={() => setF(blank)}>Clear filters</Button>} />
          : <EmptyState icon="box" title="No shipments yet" message="Create a shipment to assign a driver and vehicle and start tracking." action={<Button onClick={() => setCreating(true)}>New shipment</Button>} />} />
      <ShipmentFormModal open={creating} onClose={() => setCreating(false)} />
      <ShipmentFormModal open={!!editing} shipment={editing} onClose={() => setEditing(undefined)} />
      <ConfirmDialog open={!!deleting} title="Delete shipment" confirmLabel="Delete shipment" message={`Delete ${deleting?.id} for ${deleting?.customer}? Its delivery history will be lost.`}
        onConfirm={async () => { if (deleting) await removeShipment(deleting.id); }} onClose={() => setDeleting(undefined)} />
    </>
  );
}
