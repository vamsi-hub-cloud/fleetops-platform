import type { AppNotification, Driver, Shipment, Vehicle } from '../types';
import { daysUntil, fmtDateTime, fmtDate } from './utils';

export function buildNotifications(vehicles: Vehicle[], drivers: Driver[], shipments: Shipment[]): AppNotification[] {
  const out: AppNotification[] = [];

  for (const s of shipments) {
    const last = s.history[s.history.length - 1]?.at ?? s.createdAt;
    if (s.status === 'delayed')
      out.push({ id: `delay-${s.id}`, type: 'delay', severity: 'high', at: last, link: `/shipments/${s.id}`,
        title: `${s.id} is running late`, body: `${s.customer}: ${s.origin} to ${s.destination}. ETA was ${fmtDateTime(s.eta)}.` });
    if (s.status === 'in_transit' && s.progress >= 60)
      out.push({ id: `near-${s.id}`, type: 'delivery', severity: 'low', at: last, link: `/tracking?shipment=${s.id}`,
        title: `${s.id} is ${s.progress}% of the way`, body: `Heading to ${s.destination} for ${s.customer}.` });
    if (s.status === 'delivered' && s.deliveredAt && Date.now() - new Date(s.deliveredAt).getTime() < 72 * 3600e3)
      out.push({ id: `done-${s.id}`, type: 'delivery', severity: 'low', at: s.deliveredAt, link: `/shipments/${s.id}`,
        title: `${s.id} delivered`, body: `${s.customer} received ${s.cargo.toLowerCase()} in ${s.destination}.` });
  }

  for (const v of vehicles) {
    const last = v.history[0]?.at ?? new Date().toISOString();
    const days = daysUntil(v.nextService);
    if (v.status === 'maintenance')
      out.push({ id: `maint-${v.id}`, type: 'maintenance', severity: 'medium', at: last, link: `/vehicles/${v.id}`,
        title: `${v.plate} is in maintenance`, body: `${v.model} is unavailable for dispatch until service is complete.` });
    if (days < 0)
      out.push({ id: `overdue-${v.id}`, type: 'maintenance', severity: 'high', at: v.nextService, link: `/vehicles/${v.id}`,
        title: `${v.plate} service overdue`, body: `Service was due ${fmtDate(v.nextService)}.` });
    else if (days <= 7)
      out.push({ id: `due-${v.id}`, type: 'maintenance', severity: 'medium', at: last, link: `/vehicles/${v.id}`,
        title: `${v.plate} service due in ${days} day${days === 1 ? '' : 's'}`, body: `Book a slot before ${fmtDate(v.nextService)}.` });
    if (v.fuelLevel < 20)
      out.push({ id: `fuel-${v.id}`, type: 'maintenance', severity: 'medium', at: last, link: `/vehicles/${v.id}`,
        title: `${v.plate} fuel is low`, body: `Only ${v.fuelLevel}% left in the tank.` });
  }

  for (const d of drivers) {
    if (d.status !== 'on_leave' && d.status !== 'off_duty') continue;
    const assigned = vehicles.some((v) => v.driverId === d.id);
    out.push({ id: `drv-${d.id}`, type: 'driver', severity: assigned ? 'medium' : 'low', at: d.statusSince, link: `/drivers/${d.id}`,
      title: `${d.name} is ${d.status === 'on_leave' ? 'on leave' : 'off duty'}`,
      body: assigned ? 'A vehicle is still assigned to this driver.' : 'No vehicle assigned.' });
  }

  return out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
