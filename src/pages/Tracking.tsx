import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Card, EmptyState, FilterSelect, Meter, PageHeader, SearchInput } from '../components/ui';
import { FleetMap } from '../components/map/FleetMap';
import { useApp } from '../store/AppContext';
import { distanceKm } from '../lib/geo';
import { cn, fmtDateTime, humanize, timeUntil } from '../lib/utils';

export default function Tracking() {
  const { shipments, vehicles, drivers } = useApp();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showIdle, setShowIdle] = useState(true);
  const selectedId = params.get('shipment') ?? undefined;

  const live = useMemo(() => shipments.filter((s) => ['in_transit', 'delayed', 'pending'].includes(s.status)), [shipments]);
  const list = useMemo(() => live.filter((s) => (!status || s.status === status) && (!q || `${s.id} ${s.customer} ${s.origin} ${s.destination}`.toLowerCase().includes(q.toLowerCase()))), [live, q, status]);
  const selected = shipments.find((s) => s.id === selectedId);
  const select = (id: string) => setParams(id === selectedId ? {} : { shipment: id });

  const vehicle = vehicles.find((v) => v.id === selected?.vehicleId);
  const driver = drivers.find((d) => d.id === selected?.driverId);
  const total = selected ? distanceKm(selected.origin, selected.destination) : 0;
  const remaining = selected ? Math.round(total * (1 - selected.progress / 100)) : 0;

  return (
    <>
      <PageHeader title="Live tracking" subtitle={`${live.filter((s) => s.status !== 'pending').length} vehicles on the road · positions refresh when shipment data changes`} />
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="order-2 flex min-h-0 flex-col gap-3 lg:order-1">
          <div className="grid grid-cols-2 gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search shipments" />
            <FilterSelect label="All active" value={status} onChange={setStatus} options={[['pending', 'Pending'], ['in_transit', 'In transit'], ['delayed', 'Delayed']]} />
          </div>
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {list.map((s) => (
              <li key={s.id}>
                <button onClick={() => select(s.id)} aria-pressed={s.id === selectedId}
                  className={cn('w-full rounded-lg border bg-white p-3 text-left transition-colors', s.id === selectedId ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300')}>
                  <div className="flex items-center justify-between gap-2"><span className="font-medium text-slate-900">{s.id}</span><Badge status={s.status} /></div>
                  <p className="mt-0.5 text-sm text-slate-600">{s.origin} → {s.destination}</p>
                  <p className="text-xs text-slate-400">{s.customer} · ETA {fmtDateTime(s.eta)}</p>
                  <div className="mt-2"><Meter value={s.progress} tone={s.status === 'delayed' ? 'red' : 'blue'} /></div>
                </button>
              </li>
            ))}
            {!list.length && <li className="rounded-lg border border-slate-200 bg-white"><EmptyState icon="map" title="Nothing to track" message={live.length ? 'No active shipments match your filters.' : 'Dispatch a shipment and it will appear on the map.'} /></li>}
          </ul>
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <FleetMap className="h-[22rem] sm:h-[30rem] lg:h-[36rem]" shipments={list.length ? list : []} vehicles={vehicles} selectedId={selectedId} onSelect={select} showVehicles={showIdle} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showIdle} onChange={(e) => setShowIdle(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />Show parked and offline vehicles</label>
          {selected && (
            <Card title={`${selected.id} · ${selected.customer}`} action={<Link to={`/shipments/${selected.id}`} className="text-xs font-medium text-brand-600">Open shipment</Link>}>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-500">Estimated delivery</p><p className="font-medium">{fmtDateTime(selected.eta)}</p><p className={cn('text-xs', selected.status === 'delayed' ? 'text-red-600' : 'text-slate-500')}>{timeUntil(selected.eta)}</p></div>
                <div><p className="text-xs text-slate-500">Distance left</p><p className="font-medium">{remaining} km</p><p className="text-xs text-slate-500">of {total} km</p></div>
                <div><p className="text-xs text-slate-500">Vehicle</p><p className="font-medium">{vehicle?.plate ?? 'Unassigned'}</p><p className="text-xs text-slate-500">{vehicle ? `${vehicle.fuelLevel}% fuel` : ''}</p></div>
                <div><p className="text-xs text-slate-500">Driver</p><p className="font-medium">{driver?.name ?? 'Unassigned'}</p><p className="text-xs text-slate-500">{driver?.phone}</p></div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Pickup {selected.origin} · Delivery {selected.destination} · {humanize(selected.status)}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
