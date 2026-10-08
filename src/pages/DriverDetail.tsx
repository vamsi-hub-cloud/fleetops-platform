import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, ConfirmDialog, DL, EmptyState, Icon, Meter, PageHeader, Stat } from '../components/ui';
import { DriverFormModal } from '../components/forms/DriverFormModal';
import { useApp } from '../store/AppContext';
import { fmtDate, fmtDateTime, timeAgo } from '../lib/utils';

export default function DriverDetail() {
  const { id } = useParams();
  const { drivers, vehicles, shipments, removeDriver } = useApp();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const d = drivers.find((x) => x.id === id);
  if (!d) return <EmptyState icon="user" title="Driver not found" message="This profile may have been removed." action={<Link className="text-sm font-medium text-brand-600" to="/drivers">Back to drivers</Link>} />;

  const vehicle = vehicles.find((v) => v.driverId === d.id);
  const history = shipments.filter((s) => s.driverId === d.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const done = history.filter((s) => s.status === 'delivered');
  const late = done.filter((s) => s.deliveredAt && new Date(s.deliveredAt) > new Date(s.eta)).length;

  return (
    <>
      <PageHeader back={{ to: '/drivers', label: 'Drivers' }} title={d.name} subtitle={`${d.id} · based in ${d.base}`}
        action={<><Badge status={d.status} /><Button variant="secondary" onClick={() => setEdit(true)}><Icon name="edit" className="h-4 w-4" />Edit</Button><Button variant="secondary" className="text-red-600" onClick={() => setDel(true)}><Icon name="trash" className="h-4 w-4" />Remove</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Rating" value={`${d.rating.toFixed(1)} ★`} icon="check" tone="brand" />
        <Stat label="On-time rate" value={`${d.onTimeRate}%`} icon="clock" tone="green" />
        <Stat label="Lifetime deliveries" value={d.totalDeliveries} icon="box" tone="blue" />
        <Stat label="Late in recent trips" value={late} hint={`of ${done.length} completed here`} icon="alert" tone={late ? 'red' : 'slate'} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card title="Profile"><DL items={[['Mobile', d.phone], ['Email', d.email], ['Licence', d.license], ['Joined', fmtDate(d.joined)], ['Status since', `${fmtDateTime(d.statusSince)} (${timeAgo(d.statusSince)})`]]} /></Card>
          <Card title="Assigned vehicle">
            {vehicle ? <Link to={`/vehicles/${vehicle.id}`} className="block rounded-md border border-slate-200 p-3 hover:border-brand-400"><div className="flex items-center justify-between"><span className="font-medium">{vehicle.plate}</span><Badge status={vehicle.status} /></div><p className="text-xs text-slate-500">{vehicle.model} · {vehicle.location}</p><div className="mt-2"><Meter value={vehicle.fuelLevel} /></div></Link>
              : <p className="text-sm text-slate-500">No vehicle assigned. Assign one from the vehicle’s edit form.</p>}
          </Card>
        </div>
        <Card title={`Delivery history (${history.length})`} className="lg:col-span-2" pad={false}>
          {history.length ? <ul className="divide-y divide-slate-100">{history.map((s) => (
            <li key={s.id}><Link to={`/shipments/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <span className="min-w-0 flex-1 text-sm"><span className="font-medium">{s.id}</span> · {s.customer}<span className="block text-xs text-slate-500">{s.origin} → {s.destination} · {s.deliveredAt ? `delivered ${fmtDateTime(s.deliveredAt)}` : `ETA ${fmtDateTime(s.eta)}`}</span></span>
              <Badge status={s.status} /></Link></li>))}</ul>
            : <EmptyState icon="box" title="No deliveries yet" message="Shipments assigned to this driver will show up here." />}
        </Card>
      </div>
      <DriverFormModal open={edit} driver={d} onClose={() => setEdit(false)} />
      <ConfirmDialog open={del} title="Remove driver" confirmLabel="Remove driver" message={`Remove ${d.name}? This can’t be undone.`} onConfirm={async () => { await removeDriver(d.id); nav('/drivers'); }} onClose={() => setDel(false)} />
    </>
  );
}
