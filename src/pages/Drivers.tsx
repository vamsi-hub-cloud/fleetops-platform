import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, ConfirmDialog, EmptyState, FilterBar, FilterSelect, Icon, PageHeader, SearchInput } from '../components/ui';
import { DataTable, type Column } from '../components/ui/DataTable';
import { DriverFormModal } from '../components/forms/DriverFormModal';
import { useApp } from '../store/AppContext';
import { CITY_NAMES } from '../lib/geo';
import { fmtDate, humanize } from '../lib/utils';
import type { Driver } from '../types';

const blank = { q: '', status: '', vehicle: '', base: '', joined: '' };

export default function Drivers() {
  const { drivers, vehicles, removeDriver } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState<Driver | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Driver | undefined>();
  const vehicleOf = (id: string) => vehicles.find((v) => v.driverId === id);

  const rows = useMemo(() => drivers.filter((d) => {
    const q = f.q.trim().toLowerCase();
    if (q && ![d.id, d.name, d.phone, d.license].some((s) => s.toLowerCase().includes(q))) return false;
    if (f.status && d.status !== f.status) return false;
    if (f.vehicle === 'assigned' && !vehicleOf(d.id)) return false;
    if (f.vehicle === 'none' && vehicleOf(d.id)) return false;
    if (f.base && d.base !== f.base) return false;
    if (f.joined && d.joined < f.joined) return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [drivers, vehicles, f]);

  const cols: Column<Driver>[] = [
    { key: 'n', header: 'Driver', render: (d) => <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-800 text-xs font-semibold text-white">{d.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span><div><p className="font-medium text-slate-900">{d.name}</p><p className="text-xs text-slate-500">{d.id} · {d.base}</p></div></div> },
    { key: 's', header: 'Status', render: (d) => <Badge status={d.status} /> },
    { key: 'v', header: 'Vehicle', hide: 'md', render: (d) => vehicleOf(d.id)?.plate ?? <span className="text-slate-400">None</span> },
    { key: 'r', header: 'Rating', hide: 'sm', render: (d) => `${d.rating.toFixed(1)} ★` },
    { key: 'o', header: 'On-time', hide: 'lg', render: (d) => `${d.onTimeRate}%` },
    { key: 't', header: 'Deliveries', hide: 'lg', render: (d) => d.totalDeliveries },
    { key: 'j', header: 'Joined', hide: 'lg', render: (d) => fmtDate(d.joined) },
    { key: 'a', header: '', align: 'right', render: (d) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}><Icon name="edit" className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Remove ${d.name}`} className="text-red-600 hover:bg-red-50" onClick={() => setDeleting(d)}><Icon name="trash" className="h-4 w-4" /></Button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Drivers" subtitle="Availability, assignments and performance" action={<Button onClick={() => setCreating(true)}><Icon name="plus" className="h-4 w-4" />Add driver</Button>} />
      <FilterBar active={JSON.stringify(f) !== JSON.stringify(blank)} onReset={() => setF(blank)} count={rows.length} total={drivers.length}>
        <SearchInput value={f.q} onChange={(q) => setF({ ...f, q })} placeholder="Search name, phone or licence" />
        <FilterSelect label="All statuses" value={f.status} onChange={(status) => setF({ ...f, status })} options={['available', 'on_trip', 'off_duty', 'on_leave'].map((s) => [s, humanize(s)])} />
        <FilterSelect label="Any vehicle" value={f.vehicle} onChange={(vehicle) => setF({ ...f, vehicle })} options={[['assigned', 'Has a vehicle'], ['none', 'No vehicle']]} />
        <FilterSelect label="All bases" value={f.base} onChange={(base) => setF({ ...f, base })} options={CITY_NAMES.map((c) => [c, c])} />
        <label className="flex items-center gap-2 text-xs text-slate-500">Joined after<input type="date" className="input" value={f.joined} onChange={(e) => setF({ ...f, joined: e.target.value })} /></label>
      </FilterBar>
      <DataTable rows={rows} columns={cols} onRowClick={(d) => nav(`/drivers/${d.id}`)}
        empty={drivers.length ? <EmptyState icon="search" title="No drivers match these filters" message="Try a different status or base, or clear the filters." action={<Button variant="secondary" onClick={() => setF(blank)}>Clear filters</Button>} />
          : <EmptyState icon="user" title="No drivers yet" message="Add a driver to start assigning vehicles and shipments." action={<Button onClick={() => setCreating(true)}>Add driver</Button>} />} />
      <DriverFormModal open={creating} onClose={() => setCreating(false)} />
      <DriverFormModal open={!!editing} driver={editing} onClose={() => setEditing(undefined)} />
      <ConfirmDialog open={!!deleting} title="Remove driver" confirmLabel="Remove driver" message={`Remove ${deleting?.name}? Their vehicle will become unassigned.`}
        onConfirm={async () => { if (deleting) await removeDriver(deleting.id); }} onClose={() => setDeleting(undefined)} />
    </>
  );
}
