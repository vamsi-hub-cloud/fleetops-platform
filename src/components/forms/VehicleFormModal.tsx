import { Button, Field, Modal } from '../ui';
import { useForm } from '../../hooks/useForm';
import { useApp } from '../../store/AppContext';
import { CITY_NAMES } from '../../lib/geo';
import { humanize } from '../../lib/utils';
import type { Vehicle, VehicleStatus, VehicleType } from '../../types';

const TYPES: VehicleType[] = ['Heavy truck', 'Medium truck', 'Light truck', 'Mini van'];
const STATUSES: VehicleStatus[] = ['active', 'idle', 'maintenance', 'offline'];

export function VehicleFormModal({ open, vehicle, onClose }: { open: boolean; vehicle?: Vehicle; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={vehicle ? `Edit ${vehicle.plate}` : 'Add vehicle'} wide>
      <VehicleForm vehicle={vehicle} onClose={onClose} />
    </Modal>
  );
}

function VehicleForm({ vehicle, onClose }: { vehicle?: Vehicle; onClose: () => void }) {
  const { drivers, vehicles, saveVehicle } = useApp();
  const f = useForm(
    {
      plate: vehicle?.plate ?? '', model: vehicle?.model ?? '', type: vehicle?.type ?? 'Heavy truck',
      status: vehicle?.status ?? 'idle', driverId: vehicle?.driverId ?? '', location: vehicle?.location ?? CITY_NAMES[0],
      fuelLevel: String(vehicle?.fuelLevel ?? 100), mileage: String(vehicle?.mileage ?? 0), fuelEfficiency: String(vehicle?.fuelEfficiency ?? 5),
      lastService: vehicle?.lastService ?? new Date().toISOString().slice(0, 10),
      nextService: vehicle?.nextService ?? new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
    },
    (v) => {
      const e: Record<string, string> = {};
      if (!/^[A-Za-z]{2}\d{2}[A-Za-z]{1,3}\d{4}$/.test(v.plate.replace(/[\s-]/g, ''))) e.plate = 'Use a plate like TS09EA4521';
      else if (vehicles.some((x) => x.id !== vehicle?.id && x.plate.toUpperCase() === v.plate.replace(/[\s-]/g, '').toUpperCase())) e.plate = 'This plate is already registered';
      if (!v.model.trim()) e.model = 'Enter the vehicle model';
      const fuel = Number(v.fuelLevel);
      if (v.fuelLevel === '' || Number.isNaN(fuel) || fuel < 0 || fuel > 100) e.fuelLevel = 'Enter a value from 0 to 100';
      if (v.mileage === '' || Number(v.mileage) < 0) e.mileage = 'Mileage cannot be negative';
      if (!(Number(v.fuelEfficiency) > 0)) e.fuelEfficiency = 'Enter km per litre above 0';
      if (!v.lastService) e.lastService = 'Pick the last service date';
      if (!v.nextService) e.nextService = 'Pick the next service date';
      else if (v.lastService && v.nextService < v.lastService) e.nextService = 'Next service must be after the last one';
      if (v.status === 'maintenance' && v.driverId) e.driverId = 'Unassign the driver while in maintenance';
      return e;
    },
  );

  // drivers who are free, plus whoever currently drives this vehicle
  const options = drivers.filter((d) => d.id === vehicle?.driverId || !vehicles.some((x) => x.driverId === d.id && x.id !== vehicle?.id));

  const submit = f.handleSubmit(async (v) => {
    const now = new Date().toISOString();
    await saveVehicle({
      ...(vehicle ?? { history: [{ at: now, event: 'Vehicle added to fleet' }] }),
      id: vehicle?.id,
      plate: v.plate.replace(/[\s-]/g, '').toUpperCase(), model: v.model.trim(), type: v.type as VehicleType, status: v.status as VehicleStatus,
      driverId: v.driverId || undefined, location: v.location, fuelLevel: Number(v.fuelLevel), mileage: Number(v.mileage),
      fuelEfficiency: Number(v.fuelEfficiency), lastService: v.lastService, nextService: v.nextService,
      history: vehicle
        ? [{ at: now, event: `Details updated${vehicle.status !== v.status ? ` · status ${humanize(vehicle.status)} → ${humanize(v.status)}` : ''}` }, ...vehicle.history]
        : [{ at: now, event: 'Vehicle added to fleet' }],
    });
    onClose();
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Registration plate" required error={f.errors.plate}><input {...f.bind('plate')} placeholder="TS09EA4521" /></Field>
      <Field label="Model" required error={f.errors.model}><input {...f.bind('model')} placeholder="Tata Prima 4928.S" /></Field>
      <Field label="Type"><select {...f.bind('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Status"><select {...f.bind('status')}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></Field>
      <Field label="Assigned driver" error={f.errors.driverId}>
        <select {...f.bind('driverId')}><option value="">Unassigned</option>{options.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      </Field>
      <Field label="Current location"><select {...f.bind('location')}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Fuel level (%)" required error={f.errors.fuelLevel}><input type="number" {...f.bind('fuelLevel')} /></Field>
      <Field label="Odometer (km)" required error={f.errors.mileage}><input type="number" {...f.bind('mileage')} /></Field>
      <Field label="Fuel efficiency (km/l)" required error={f.errors.fuelEfficiency}><input type="number" step="0.1" {...f.bind('fuelEfficiency')} /></Field>
      <span className="hidden sm:block" />
      <Field label="Last service" required error={f.errors.lastService}><input type="date" {...f.bind('lastService')} /></Field>
      <Field label="Next service due" required error={f.errors.nextService}><input type="date" {...f.bind('nextService')} /></Field>
      {f.submitError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{f.submitError}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={f.submitting}>{vehicle ? 'Save changes' : 'Add vehicle'}</Button>
      </div>
    </form>
  );
}
