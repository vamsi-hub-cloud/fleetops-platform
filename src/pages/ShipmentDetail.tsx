import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, ConfirmDialog, DL, EmptyState, Icon, Meter, PageHeader, Timeline } from '../components/ui';
import { ShipmentFormModal } from '../components/forms/ShipmentFormModal';
import { FleetMap } from '../components/map/FleetMap';
import { useApp } from '../store/AppContext';
import { distanceKm } from '../lib/geo';
import { fmtDateTime, humanize, timeUntil } from '../lib/utils';
import type { ShipmentStatus } from '../types';

const NEXT: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['in_transit', 'cancelled'], in_transit: ['delivered', 'delayed', 'cancelled'], delayed: ['in_transit', 'delivered', 'cancelled'], delivered: [], cancelled: [],
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const { shipments, drivers, vehicles, saveShipment, removeShipment } = useApp();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [err, setErr] = useState('');
  const s = shipments.find((x) => x.id === id);
  if (!s) return <EmptyState icon="box" title="Shipment not found" message="It may have been deleted." action={<Link className="text-sm font-medium text-brand-600" to="/shipments">Back to shipments</Link>} />;

  const driver = drivers.find((d) => d.id === s.driverId);
  const vehicle = vehicles.find((v) => v.id === s.vehicleId);
  const km = distanceKm(s.origin, s.destination);

  const move = async (status: ShipmentStatus) => {
    if ((status === 'in_transit') && (!s.driverId || !s.vehicleId)) { setErr('Assign a driver and vehicle before dispatching.'); return; }
    setBusy(status); setErr('');
    const now = new Date().toISOString();
    try {
      await saveShipment({ ...s, status, progress: status === 'delivered' ? 100 : status === 'cancelled' ? 0 : s.progress || 5,
        deliveredAt: status === 'delivered' ? now : undefined,
        history: [...s.history, { at: now, status, note: { in_transit: s.status === 'delayed' ? 'Back on schedule' : 'Picked up and departed origin', delivered: 'Delivered and signed by receiver', delayed: 'Marked as delayed by dispatcher', cancelled: 'Shipment cancelled', pending: '' }[status] }] });
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not update the shipment'); }
    finally { setBusy(undefined); }
  };

  return (
    <>
      <PageHeader back={{ to: '/shipments', label: 'Shipments' }} title={s.id} subtitle={`${s.customer} · ${s.origin} to ${s.destination}`}
        action={<><Badge status={s.status} /><Link to={`/tracking?shipment=${s.id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Icon name="map" className="h-4 w-4" />Track</Link><Button variant="secondary" onClick={() => setEdit(true)}><Icon name="edit" className="h-4 w-4" />Edit</Button><Button variant="secondary" className="text-red-600" onClick={() => setDel(true)}><Icon name="trash" className="h-4 w-4" />Delete</Button></>} />

      {NEXT[s.status].length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <span className="mr-1 text-sm text-slate-500">Update status:</span>
          {NEXT[s.status].map((n) => <Button key={n} size="sm" variant={n === 'cancelled' ? 'secondary' : 'primary'} className={n === 'cancelled' ? 'text-red-600' : ''} loading={busy === n} onClick={() => move(n)}>{{ in_transit: s.status === 'pending' ? 'Dispatch' : 'Resume transit', delivered: 'Mark delivered', delayed: 'Flag as delayed', cancelled: 'Cancel shipment', pending: '' }[n]}</Button>)}
          {err && <span role="alert" className="text-sm text-red-600">{err}</span>}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Route" pad={false}>
            <FleetMap className="h-64" shipments={[s]} vehicles={vehicle ? [vehicle] : []} selectedId={s.id} showVehicles={false} />
            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 p-4 text-sm">
              <div><p className="text-xs text-slate-500">Distance</p><p className="font-medium">{km} km</p></div>
              <div><p className="text-xs text-slate-500">Progress</p><p className="font-medium">{s.progress}%</p></div>
              <div><p className="text-xs text-slate-500">{s.status === 'delivered' ? 'Delivered' : 'ETA'}</p><p className="font-medium">{s.status === 'delivered' && s.deliveredAt ? fmtDateTime(s.deliveredAt) : `${fmtDateTime(s.eta)} (${timeUntil(s.eta)})`}</p></div>
              <div className="col-span-3"><Meter value={s.progress} tone={s.status === 'delayed' ? 'red' : 'blue'} /></div>
            </div>
          </Card>
          <Card title="Shipment details">
            <DL items={[
              ['Customer', s.customer], ['Contact', s.customerPhone], ['Pickup', s.origin], ['Delivery', s.destination],
              ['Cargo', `${s.cargo} · ${s.weightKg.toLocaleString('en-IN')} kg`], ['Created', fmtDateTime(s.createdAt)],
              ['Driver', driver ? <Link className="text-brand-600 hover:underline" to={`/drivers/${driver.id}`}>{driver.name}</Link> : 'Unassigned'],
              ['Vehicle', vehicle ? <Link className="text-brand-600 hover:underline" to={`/vehicles/${vehicle.id}`}>{vehicle.plate}</Link> : 'Unassigned'],
            ]} />
          </Card>
        </div>
        <Card title="Delivery history"><Timeline items={[...s.history].reverse().map((h) => ({ at: fmtDateTime(h.at), title: humanize(h.status), note: h.note }))} /></Card>
      </div>
      <ShipmentFormModal open={edit} shipment={s} onClose={() => setEdit(false)} />
      <ConfirmDialog open={del} title="Delete shipment" confirmLabel="Delete shipment" message={`Delete ${s.id}? This can’t be undone.`} onConfirm={async () => { await removeShipment(s.id); nav('/shipments'); }} onClose={() => setDel(false)} />
    </>
  );
}
