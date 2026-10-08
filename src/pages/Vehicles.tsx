import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, ConfirmDialog, EmptyState, FilterBar, FilterSelect, Icon, Meter, PageHeader, SearchInput } from '../components/ui';
import { DataTable, type Column } from '../components/ui/DataTable';
import { VehicleFormModal } from '../components/forms/VehicleFormModal';
import { useApp } from '../store/AppContext';
import { CITY_NAMES } from '../lib/geo';
import { fmtDate, humanize } from '../lib/utils';
import type { Vehicle } from '../types';

const blank = { q: '', status: '', driver: '', location: '', due: '' };

export default function Vehicles() {
  const { vehicles, drivers, removeVehicle } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState<Vehicle | undefined>();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Vehicle | undefined>();
  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name;

  const rows = useMemo(() => vehicles.filter((v) => {
    const q = f.q.trim().toLowerCase();
    if (q && ![v.id, v.plate, v.model].some((s) => s.toLowerCase().includes(q))) return false;
    if (f.status && v.status !== f.status) return false;
    if (f.driver === 'none' ? v.driverId : f.driver && v.driverId !== f.driver) return false;
    if (f.location && v.location !== f.location) return false;
    if (f.due && v.nextService > f.due) return false;
    return true;
  }), [vehicles, f]);

  const cols: Column<Vehicle>[] = [
    { key: 'v', header: 'Vehicle', render: (v) => <div><p className="font-medium text-slate-900">{v.plate}</p><p className="text-xs text-slate-500">{v.model} · {v.type}</p></div> },
    { key: 's', header: 'Status', render: (v) => <Badge status={v.status} /> },
    { key: 'd', header: 'Driver', hide: 'md', render: (v) => driverName(v.driverId) ?? <span className="text-slate-400">Unassigned</span> },
    { key: 'l', header: 'Location', hide: 'lg', render: (v) => v.location },
    { key: 'f', header: 'Fuel', hide: 'sm', render: (v) => <div className="w-24"><span className="text-xs text-slate-600">{v.fuelLevel}%</span><Meter value={v.fuelLevel} /></div> },
    { key: 'n', header: 'Next service', hide: 'lg', render: (v) => fmtDate(v.nextService) },
    { key: 'a', header: '', align: 'right', render: (v) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" aria-label={`Edit ${v.plate}`} onClick={() => setEditing(v)}><Icon name="edit" className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" aria-label={`Remove ${v.plate}`} className="text-red-600 hover:bg-red-50" onClick={() => setDeleting(v)}><Icon name="trash" className="h-4 w-4" /></Button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Vehicles" subtitle="Fleet inventory, assignments and service status" action={<Button onClick={() => setCreating(true)}><Icon name="plus" className="h-4 w-4" />Add vehicle</Button>} />
      <FilterBar active={JSON.stringify(f) !== JSON.stringify(blank)} onReset={() => setF(blank)} count={rows.length} total={vehicles.length}>
        <SearchInput value={f.q} onChange={(q) => setF({ ...f, q })} placeholder="Search plate, model or ID" />
        <FilterSelect label="All statuses" value={f.status} onChange={(status) => setF({ ...f, status })} options={['active', 'idle', 'maintenance', 'offline'].map((s) => [s, humanize(s)])} />
        <FilterSelect label="Any driver" value={f.driver} onChange={(driver) => setF({ ...f, driver })} options={[['none', 'Unassigned'], ...drivers.map((d): [string, string] => [d.id, d.name])]} />
        <FilterSelect label="All locations" value={f.location} onChange={(location) => setF({ ...f, location })} options={CITY_NAMES.map((c) => [c, c])} />
        <label className="flex items-center gap-2 text-xs text-slate-500 sm:col-span-2 lg:col-span-1">Service due by<input type="date" className="input" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
      </FilterBar>
      <DataTable rows={rows} columns={cols} onRowClick={(v) => nav(`/vehicles/${v.id}`)}
        empty={vehicles.length ? <EmptyState icon="search" title="No vehicles match these filters" message="Try a different status or location, or clear the filters." action={<Button variant="secondary" onClick={() => setF(blank)}>Clear filters</Button>} />
          : <EmptyState icon="truck" title="No vehicles yet" message="Add your first vehicle to start assigning drivers and shipments." action={<Button onClick={() => setCreating(true)}>Add vehicle</Button>} />} />
      <VehicleFormModal open={creating} onClose={() => setCreating(false)} />
      <VehicleFormModal open={!!editing} vehicle={editing} onClose={() => setEditing(undefined)} />
      <ConfirmDialog open={!!deleting} title="Remove vehicle" confirmLabel="Remove vehicle" message={`Remove ${deleting?.plate} from the fleet? Its history will be deleted and shipments will show it as unassigned.`}
        onConfirm={async () => { if (deleting) await removeVehicle(deleting.id); }} onClose={() => setDeleting(undefined)} />
    </>
  );
}
