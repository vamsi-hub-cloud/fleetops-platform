import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { api } from '../services/api';
import { buildNotifications } from '../lib/notifications';
import type { AppNotification, Driver, ResourceKey, Shipment, Vehicle } from '../types';

interface State {
  vehicles: Vehicle[];
  drivers: Driver[];
  shipments: Shipment[];
  status: 'loading' | 'ready' | 'error';
  error?: string;
  read: string[];
}

type Action =
  | { type: 'loading' }
  | { type: 'loaded'; payload: Pick<State, 'vehicles' | 'drivers' | 'shipments'> }
  | { type: 'error'; error: string }
  | { type: 'upsert'; key: ResourceKey; item: { id: string } }
  | { type: 'remove'; key: ResourceKey; id: string }
  | { type: 'read'; ids: string[] };

const initial: State = { vehicles: [], drivers: [], shipments: [], status: 'loading', read: [] };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'loading': return { ...state, status: 'loading', error: undefined };
    case 'loaded': return { ...state, ...a.payload, status: 'ready' };
    case 'error': return { ...state, status: 'error', error: a.error };
    case 'upsert': {
      const list = state[a.key] as { id: string }[];
      const exists = list.some((r) => r.id === a.item.id);
      const next = exists ? list.map((r) => (r.id === a.item.id ? a.item : r)) : [a.item, ...list];
      return { ...state, [a.key]: next };
    }
    case 'remove': return { ...state, [a.key]: (state[a.key] as { id: string }[]).filter((r) => r.id !== a.id) };
    case 'read': return { ...state, read: Array.from(new Set([...state.read, ...a.ids])) };
  }
}

type Draft<T> = Omit<T, 'id'> & { id?: string };

interface Ctx extends State {
  notifications: (AppNotification & { read: boolean })[];
  unreadCount: number;
  reload: () => Promise<void>;
  saveVehicle: (v: Draft<Vehicle>) => Promise<Vehicle>;
  saveDriver: (d: Draft<Driver>) => Promise<Driver>;
  saveShipment: (s: Draft<Shipment>) => Promise<Shipment>;
  removeVehicle: (id: string) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  removeShipment: (id: string) => Promise<void>;
  markRead: (ids: string[]) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const reload = useCallback(async () => {
    dispatch({ type: 'loading' });
    try {
      const [vehicles, drivers, shipments] = await Promise.all([api.vehicles.list(), api.drivers.list(), api.shipments.list()]);
      dispatch({ type: 'loaded', payload: { vehicles, drivers, shipments } });
    } catch (e) {
      dispatch({ type: 'error', error: e instanceof Error ? e.message : 'Could not load fleet data' });
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const save = useCallback(async <T extends { id: string }>(key: ResourceKey, data: Draft<T>): Promise<T> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = api[key] as any;
    const item: T = data.id ? await res.update(data.id, data) : await res.create(data);
    dispatch({ type: 'upsert', key, item });
    return item;
  }, []);

  const saveVehicle = useCallback(async (v: Draft<Vehicle>) => {
    const saved = await save<Vehicle>('vehicles', v);
    if (saved.driverId) {
      // a driver can only drive one vehicle at a time
      for (const other of state.vehicles.filter((x) => x.driverId === saved.driverId && x.id !== saved.id)) {
        const updated = await api.vehicles.update(other.id, { driverId: undefined });
        dispatch({ type: 'upsert', key: 'vehicles', item: updated });
      }
    }
    return saved;
  }, [save, state.vehicles]);

  const removeVehicle = useCallback(async (id: string) => {
    await api.vehicles.remove(id);
    dispatch({ type: 'remove', key: 'vehicles', id });
  }, []);

  const removeDriver = useCallback(async (id: string) => {
    await api.drivers.remove(id);
    dispatch({ type: 'remove', key: 'drivers', id });
    for (const v of state.vehicles.filter((x) => x.driverId === id)) {
      const updated = await api.vehicles.update(v.id, { driverId: undefined });
      dispatch({ type: 'upsert', key: 'vehicles', item: updated });
    }
  }, [state.vehicles]);

  const removeShipment = useCallback(async (id: string) => {
    await api.shipments.remove(id);
    dispatch({ type: 'remove', key: 'shipments', id });
  }, []);

  const notifications = useMemo(
    () => buildNotifications(state.vehicles, state.drivers, state.shipments).map((n) => ({ ...n, read: state.read.includes(n.id) })),
    [state.vehicles, state.drivers, state.shipments, state.read],
  );

  const value: Ctx = {
    ...state,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    reload,
    saveVehicle,
    saveDriver: (d) => save<Driver>('drivers', d),
    saveShipment: (s) => save<Shipment>('shipments', s),
    removeVehicle,
    removeDriver,
    removeShipment,
    markRead: (ids) => dispatch({ type: 'read', ids }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
