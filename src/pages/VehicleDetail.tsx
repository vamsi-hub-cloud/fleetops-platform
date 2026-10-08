import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, ConfirmDialog, DL, EmptyState, Icon, Meter, PageHeader, Timeline } from '../components/ui';
import { VehicleFormModal } from '../components/forms/VehicleFormModal';
import { useApp } from '../store/AppContext';
import { daysUntil, fmtDate, fmtDateTime } from '../lib/utils';

export default function VehicleDetail() {
  const { id } = useParams();
  const { vehicles, drivers, shipments, removeVehicle } = useApp();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const v = vehicles.find((x) => x.id === id);
  if (!v) return <EmptyState icon="truck" title="Vehicle not found" message="It may have been removed from the fleet." action={<Link className="text-sm font-medium text-brand-600" to="/vehicles">Back to vehicles</Link>} />;

  const driver = drivers.find((d) => d.id === v.driverId);
  const trips = shipments.filter((s) => s.vehicleId === v.id);
  const days = daysUntil(v.nextService);

  return (
    <>
      <PageHeader back={{ to: '/vehicles', label: 'Vehicles' }} title={v.plate} subtitle={`${v.model} · ${v.type}`}
        action={<><Badge status={v.status} /><Button variant="secondary" onClick={() => setEdit(true)}><Icon name="edit" className="h-4 w-4" />Edit</Button><Button variant="secondary" className="text-red-600" onClick={() => setDel(true)}><Icon name="trash" className="h-4 w-4" />Remove</Button></>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Details">
            <DL items={[
              ['Assigned driver', driver ? <Link className="text-brand-600 hover:underline" to={`/drivers/${driver.id}`}>{driver.name}</Link> : 'Unassigned'],
              ['Current location', v.location], ['Odometer', `${v.mileage.toLocaleString('en-IN')} km`], ['Fuel efficiency', `${v.fuelEfficiency} km/l`],
            ]} />
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Fuel"><p className="mb-2 flex items-center gap-2 text-2xl font-semibold"><Icon name="fuel" className="h-5 w-5 text-slate-400" />{v.fuelLevel}%</p><Meter value={v.fuelLevel} />{v.fuelLevel < 20 && <p className="mt-2 text-xs text-red-600">Low fuel. Refuel before the next dispatch.</p>}</Card>
            <Card title="Maintenance">
              <DL items={[['Last service', fmtDate(v.lastService)], ['Next service', fmtDate(v.nextService)]]} />
              <p className={`mt-3 text-xs ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-amber-700' : 'text-slate-500'}`}>{days < 0 ? `Overdue by ${-days} day${days === -1 ? '' : 's'}` : `Due in ${days} day${days === 1 ? '' : 's'}`}</p>
            </Card>
          </div>
          <Card title={`Trips (${trips.length})`} pad={false}>
            {trips.length ? <ul className="divide-y divide-slate-100">{trips.map((s) => (
              <li key={s.id}><Link to={`/shipments/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"><span className="flex-1 text-sm"><span className="font-medium">{s.id}</span> · {s.origin} → {s.destination}<span className="block text-xs text-slate-500">{s.customer}</span></span><Badge status={s.status} /></Link></li>))}</ul>
              : <EmptyState title="No trips yet" message="Shipments assigned to this vehicle will appear here." />}
          </Card>
        </div>
        <Card title="Activity history"><Timeline items={v.history.map((h) => ({ at: fmtDateTime(h.at), title: h.event }))} /></Card>
      </div>
      <VehicleFormModal open={edit} vehicle={v} onClose={() => setEdit(false)} />
      <ConfirmDialog open={del} title="Remove vehicle" confirmLabel="Remove vehicle" message={`Remove ${v.plate} from the fleet? This can’t be undone.`} onConfirm={async () => { await removeVehicle(v.id); nav('/vehicles'); }} onClose={() => setDel(false)} />
    </>
  );
}
