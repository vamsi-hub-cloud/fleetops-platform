/**
 * Data access layer.
 *
 * Mock mode (default): an in-memory database with simulated latency.
 * Live mode: set VITE_API_URL and every call below becomes a REST request
 *   GET    {API}/vehicles        POST {API}/vehicles
 *   PATCH  {API}/vehicles/:id    DELETE {API}/vehicles/:id
 * (same for /drivers and /shipments). Only this file needs to change.
 */
import { seedDrivers, seedShipments, seedVehicles } from '../data/mock';
import type { Driver, Shipment, Vehicle } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const wait = (ms = 350 + Math.random() * 300) => new Promise((r) => setTimeout(r, ms));

async function http<R>(path: string, init?: RequestInit): Promise<R> {
  const res = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${path}`);
  return res.status === 204 ? (undefined as R) : ((await res.json()) as R);
}

function resource<T extends { id: string }>(path: string, seed: T[], prefix: string, counter: number) {
  let rows: T[] = structuredClone(seed);
  let n = counter;
  return {
    async list(): Promise<T[]> {
      if (API_URL) return http<T[]>(path);
      await wait();
      return structuredClone(rows);
    },
    async create(data: Omit<T, 'id'>): Promise<T> {
      if (API_URL) return http<T>(path, { method: 'POST', body: JSON.stringify(data) });
      await wait(250);
      const item = { ...data, id: `${prefix}${++n}` } as unknown as T;
      rows = [item, ...rows];
      return structuredClone(item);
    },
    async update(id: string, patch: Partial<T>): Promise<T> {
      if (API_URL) return http<T>(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      await wait(250);
      const current = rows.find((r) => r.id === id);
      if (!current) throw new Error(`Record ${id} was not found`);
      const next = { ...current, ...patch, id };
      rows = rows.map((r) => (r.id === id ? next : r));
      return structuredClone(next);
    },
    async remove(id: string): Promise<void> {
      if (API_URL) return http<void>(`${path}/${id}`, { method: 'DELETE' });
      await wait(200);
      rows = rows.filter((r) => r.id !== id);
    },
  };
}

export const api = {
  vehicles: resource<Vehicle>('/vehicles', seedVehicles, 'V-', 108),
  drivers: resource<Driver>('/drivers', seedDrivers, 'D-', 208),
  shipments: resource<Shipment>('/shipments', seedShipments, 'SH-', 3014),
};
