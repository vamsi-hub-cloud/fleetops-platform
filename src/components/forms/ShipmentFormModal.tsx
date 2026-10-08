import { Button, Field, Modal } from '../ui';
import { PHONE_RE, useForm } from '../../hooks/useForm';
import { useApp } from '../../store/AppContext';
import { CITY_NAMES } from '../../lib/geo';
import { humanize, toInputDateTime } from '../../lib/utils';
import type { Shipment, ShipmentStatus } from '../../types';

const STATUSES: ShipmentStatus[] = ['pending', 'in_transit', 'delayed', 'delivered', 'cancelled'];

export function ShipmentFormModal({ open, shipment, onClose }: { open: boolean; shipment?: Shipment; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={shipment ? `Edit ${shipment.id}` : 'Create shipment'} wide>
      <ShipmentForm shipment={shipment} onClose={onClose} />
    </Modal>
  );
}

function ShipmentForm({ shipment, onClose }: { shipment?: Shipment; onClose: () => void }) {
  const { vehicles, drivers, saveShipment } = useApp();
  const f = useForm(
    {
      customer: shipment?.customer ?? '', customerPhone: shipment?.customerPhone ?? '',
      origin: shipment?.origin ?? CITY_NAMES[0], destination: shipment?.destination ?? CITY_NAMES[1],
      cargo: shipment?.cargo ?? '', weightKg: String(shipment?.weightKg ?? ''),
      vehicleId: shipment?.vehicleId ?? '', driverId: shipment?.driverId ?? '',
      eta: toInputDateTime(shipment?.eta ?? new Date(Date.now() + 24 * 3600e3).toISOString()),
      status: shipment?.status ?? 'pending',
    },
    (v) => {
      const e: Record<string, string> = {};
      if (v.customer.trim().length < 2) e.customer = 'Enter the customer name';
      if (!PHONE_RE.test(v.customerPhone.replace(/\s/g, ''))) e.customerPhone = 'Enter a 10-digit mobile number';
      if (v.origin === v.destination) e.destination = 'Delivery must differ from pickup';
      if (!v.cargo.trim()) e.cargo = 'Describe the cargo';
      if (!(Number(v.weightKg) > 0)) e.weightKg = 'Enter a weight above 0 kg';
      else if (Number(v.weightKg) > 40000) e.weightKg = 'Maximum load is 40,000 kg';
      if (!v.eta) e.eta = 'Set the estimated delivery time';
      else if (!shipment && new Date(v.eta).getTime() < Date.now()) e.eta = 'ETA must be in the future';
      if (v.status === 'in_transit' && (!v.vehicleId || !v.driverId)) e.status = 'Assign a vehicle and driver before dispatch';
      return e;
    },
  );

  const dispatchable = vehicles.filter((v) => v.status !== 'maintenance' && v.status !== 'offline' || v.id === shipment?.vehicleId);

  const onVehicle = (id: string) => {
    f.set('vehicleId', id);
    const d = vehicles.find((v) => v.id === id)?.driverId;
    if (d && !f.values.driverId) f.set('driverId', d);
  };

  const submit = f.handleSubmit(async (v) => {
    const now = new Date().toISOString();
    const status = v.status as ShipmentStatus;
    const changed = shipment && shipment.status !== status;
    await saveShipment({
      ...(shipment ?? { createdAt: now, progress: 0, history: [{ at: now, status: 'pending' as const, note: 'Shipment created and awaiting dispatch' }] }),
      id: shipment?.id,
      customer: v.customer.trim(), customerPhone: v.customerPhone.replace(/\s/g, ''), origin: v.origin, destination: v.destination,
      cargo: v.cargo.trim(), weightKg: Number(v.weightKg), vehicleId: v.vehicleId || undefined, driverId: v.driverId || undefined,
      eta: new Date(v.eta).toISOString(), status,
      progress: status === 'delivered' ? 100 : status === 'pending' || status === 'cancelled' ? 0 : shipment?.progress || 5,
      deliveredAt: status === 'delivered' ? shipment?.deliveredAt ?? now : undefined,
      history: changed ? [...shipment.history, { at: now, status, note: `Status changed to ${humanize(status).toLowerCase()}` }] : shipment?.history ?? [{ at: now, status: 'pending', note: 'Shipment created and awaiting dispatch' }],
    });
    onClose();
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Customer" required error={f.errors.customer}><input {...f.bind('customer')} placeholder="Reliance Retail" /></Field>
      <Field label="Customer phone" required error={f.errors.customerPhone}><input inputMode="numeric" {...f.bind('customerPhone')} placeholder="9010012345" /></Field>
      <Field label="Pickup location"><select {...f.bind('origin')}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Delivery location" error={f.errors.destination}><select {...f.bind('destination')}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Cargo" required error={f.errors.cargo}><input {...f.bind('cargo')} placeholder="Packaged electronics" /></Field>
      <Field label="Weight (kg)" required error={f.errors.weightKg}><input type="number" {...f.bind('weightKg')} /></Field>
      <Field label="Vehicle">
        <select {...f.bind('vehicleId')} onChange={(e) => onVehicle(e.target.value)}>
          <option value="">Unassigned</option>{dispatchable.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.type}</option>)}
        </select>
      </Field>
      <Field label="Driver"><select {...f.bind('driverId')}><option value="">Unassigned</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name} ({humanize(d.status)})</option>)}</select></Field>
      <Field label="Estimated delivery" required error={f.errors.eta}><input type="datetime-local" {...f.bind('eta')} /></Field>
      <Field label="Status" error={f.errors.status}><select {...f.bind('status')}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></Field>
      {f.submitError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{f.submitError}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={f.submitting}>{shipment ? 'Save changes' : 'Create shipment'}</Button>
      </div>
    </form>
  );
}
