import { Button, Field, Modal } from '../ui';
import { EMAIL_RE, PHONE_RE, useForm } from '../../hooks/useForm';
import { useApp } from '../../store/AppContext';
import { CITY_NAMES } from '../../lib/geo';
import { humanize } from '../../lib/utils';
import type { Driver, DriverStatus } from '../../types';

const STATUSES: DriverStatus[] = ['available', 'on_trip', 'off_duty', 'on_leave'];

export function DriverFormModal({ open, driver, onClose }: { open: boolean; driver?: Driver; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={driver ? `Edit ${driver.name}` : 'Add driver'} wide>
      <DriverForm driver={driver} onClose={onClose} />
    </Modal>
  );
}

function DriverForm({ driver, onClose }: { driver?: Driver; onClose: () => void }) {
  const { drivers, saveDriver } = useApp();
  const f = useForm(
    {
      name: driver?.name ?? '', phone: driver?.phone ?? '', email: driver?.email ?? '', license: driver?.license ?? '',
      status: driver?.status ?? 'available', base: driver?.base ?? CITY_NAMES[0], joined: driver?.joined ?? new Date().toISOString().slice(0, 10),
    },
    (v) => {
      const e: Record<string, string> = {};
      if (v.name.trim().length < 3) e.name = 'Enter the driver’s full name';
      if (!PHONE_RE.test(v.phone.replace(/\s/g, ''))) e.phone = 'Enter a 10-digit mobile number';
      if (!EMAIL_RE.test(v.email)) e.email = 'Enter a valid email address';
      if (!v.license.trim()) e.license = 'Licence number is required';
      else if (drivers.some((d) => d.id !== driver?.id && d.license.toLowerCase() === v.license.trim().toLowerCase())) e.license = 'This licence is already on file';
      if (!v.joined) e.joined = 'Pick the joining date';
      return e;
    },
  );

  const submit = f.handleSubmit(async (v) => {
    await saveDriver({
      ...(driver ?? { rating: 4, onTimeRate: 100, totalDeliveries: 0 }),
      id: driver?.id, name: v.name.trim(), phone: v.phone.replace(/\s/g, ''), email: v.email.trim(), license: v.license.trim(),
      status: v.status as DriverStatus, base: v.base, joined: v.joined,
      statusSince: driver && driver.status === v.status ? driver.statusSince : new Date().toISOString(),
    });
    onClose();
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" required error={f.errors.name}><input {...f.bind('name')} placeholder="Ravi Kumar" /></Field>
      <Field label="Mobile number" required error={f.errors.phone}><input inputMode="numeric" {...f.bind('phone')} placeholder="9848012345" /></Field>
      <Field label="Email" required error={f.errors.email}><input type="email" {...f.bind('email')} placeholder="name@company.in" /></Field>
      <Field label="Licence number" required error={f.errors.license}><input {...f.bind('license')} placeholder="TS-2019123456" /></Field>
      <Field label="Status"><select {...f.bind('status')}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></Field>
      <Field label="Home base"><select {...f.bind('base')}>{CITY_NAMES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Joined on" required error={f.errors.joined}><input type="date" {...f.bind('joined')} /></Field>
      {f.submitError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{f.submitError}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={f.submitting}>{driver ? 'Save changes' : 'Add driver'}</Button>
      </div>
    </form>
  );
}
