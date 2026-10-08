export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'offline';
export type VehicleType = 'Heavy truck' | 'Medium truck' | 'Light truck' | 'Mini van';
export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'on_leave';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: VehicleType;
  status: VehicleStatus;
  driverId?: string;
  location: string;
  fuelLevel: number; // percent
  mileage: number; // km
  fuelEfficiency: number; // km per litre
  lastService: string; // YYYY-MM-DD
  nextService: string; // YYYY-MM-DD
  history: { at: string; event: string }[];
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  license: string;
  status: DriverStatus;
  statusSince: string;
  base: string;
  rating: number;
  onTimeRate: number;
  totalDeliveries: number;
  joined: string;
}

export interface ShipmentEvent { at: string; status: ShipmentStatus; note: string }

export interface Shipment {
  id: string;
  customer: string;
  customerPhone: string;
  origin: string;
  destination: string;
  cargo: string;
  weightKg: number;
  driverId?: string;
  vehicleId?: string;
  status: ShipmentStatus;
  progress: number; // 0-100
  createdAt: string;
  eta: string;
  deliveredAt?: string;
  history: ShipmentEvent[];
}

export type NotifType = 'delay' | 'maintenance' | 'delivery' | 'driver';
export interface AppNotification {
  id: string;
  type: NotifType;
  severity: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  at: string;
  link: string;
}

export type ResourceKey = 'vehicles' | 'drivers' | 'shipments';
