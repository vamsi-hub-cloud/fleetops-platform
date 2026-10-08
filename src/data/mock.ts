import type { Driver, Shipment, ShipmentEvent, ShipmentStatus, Vehicle } from '../types';

const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
const inH = (h: number) => new Date(Date.now() + h * 3600e3).toISOString();
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

function vehicle(
  id: string, plate: string, model: string, type: Vehicle['type'], status: Vehicle['status'],
  driverId: string | undefined, location: string, fuelLevel: number, mileage: number, kmpl: number,
  lastSvc: number, nextSvc: number,
): Vehicle {
  return {
    id, plate, model, type, status, driverId, location, fuelLevel, mileage, fuelEfficiency: kmpl,
    lastService: day(lastSvc), nextService: day(nextSvc),
    history: [
      { at: ago(26), event: `Trip completed, returned to ${location} depot` },
      { at: ago(24 * 6), event: `Refuelled to full tank` },
      { at: new Date(day(lastSvc)).toISOString(), event: 'Scheduled service completed' },
    ],
  };
}

export const seedVehicles: Vehicle[] = [
  vehicle('V-101', 'TS09EA4521', 'Tata Prima 4928.S', 'Heavy truck', 'active', 'D-201', 'Hyderabad', 72, 84210, 4.2, -40, 50),
  vehicle('V-102', 'KA01AB7788', 'Ashok Leyland 2820', 'Heavy truck', 'active', 'D-202', 'Bengaluru', 45, 121540, 3.9, -75, 15),
  vehicle('V-103', 'TN07CD1290', 'Eicher Pro 3015', 'Medium truck', 'active', 'D-203', 'Chennai', 18, 66320, 5.6, -20, 70),
  vehicle('V-104', 'MH12FG3344', 'Mahindra Furio 7', 'Medium truck', 'maintenance', undefined, 'Pune', 60, 98100, 5.1, -95, -3),
  vehicle('V-105', 'TS08HJ9021', 'Tata Ace Gold', 'Mini van', 'idle', 'D-205', 'Hyderabad', 88, 31870, 14.5, -30, 60),
  vehicle('V-106', 'MH04KL5567', 'BharatBenz 1617R', 'Heavy truck', 'active', 'D-206', 'Mumbai', 54, 143020, 4.0, -55, 35),
  vehicle('V-107', 'AP16MN2210', 'Tata 407', 'Light truck', 'active', 'D-207', 'Vijayawada', 63, 52480, 7.8, -80, 5),
  vehicle('V-108', 'DL01PQ8830', 'Eicher Pro 2049', 'Light truck', 'offline', undefined, 'Delhi', 35, 77650, 7.2, -120, 20),
];

function driver(
  id: string, name: string, status: Driver['status'], base: string, rating: number, onTime: number,
  total: number, joinedDaysAgo: number, sinceH: number,
): Driver {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, '.');
  return {
    id, name, status, base, rating, onTimeRate: onTime, totalDeliveries: total,
    phone: `98${String(48000000 + Number(id.slice(2)) * 13579).slice(0, 8)}`,
    email: `${slug}@fleetops.in`,
    license: `${base.slice(0, 2).toUpperCase()}-${2015 + (Number(id.slice(2)) % 8)}${String(100000 + Number(id.slice(2)) * 777).slice(0, 6)}`,
    statusSince: ago(sinceH),
    joined: day(-joinedDaysAgo),
  };
}

export const seedDrivers: Driver[] = [
  driver('D-201', 'Ravi Kumar', 'on_trip', 'Hyderabad', 4.8, 96, 412, 1400, 5),
  driver('D-202', 'Suresh Gowda', 'on_trip', 'Bengaluru', 4.5, 91, 358, 1100, 3),
  driver('D-203', 'Karthik Raja', 'on_trip', 'Chennai', 4.1, 82, 287, 900, 9),
  driver('D-204', 'Imran Shaikh', 'on_leave', 'Pune', 4.6, 94, 330, 1250, 48),
  driver('D-205', 'Anil Reddy', 'available', 'Hyderabad', 4.7, 95, 205, 640, 2),
  driver('D-206', 'Pradeep Patil', 'on_trip', 'Mumbai', 4.4, 89, 466, 1700, 4),
  driver('D-207', 'Venkat Rao', 'on_trip', 'Vijayawada', 3.9, 78, 174, 420, 7),
  driver('D-208', 'Manoj Singh', 'off_duty', 'Delhi', 4.3, 88, 241, 800, 12),
];

function events(status: ShipmentStatus, createdH: number, deliveredH?: number): ShipmentEvent[] {
  const h: ShipmentEvent[] = [{ at: ago(createdH), status: 'pending', note: 'Shipment created and awaiting dispatch' }];
  if (status === 'cancelled') return [...h, { at: ago(createdH - 2), status: 'cancelled', note: 'Cancelled by customer before pickup' }];
  if (status === 'pending') return h;
  h.push({ at: ago(createdH - 2), status: 'in_transit', note: 'Picked up and departed origin' });
  if (status === 'delayed') h.push({ at: ago(Math.max(1, createdH / 3)), status: 'delayed', note: 'Delayed by heavy traffic on route' });
  if (status === 'delivered') h.push({ at: ago(deliveredH ?? 1), status: 'delivered', note: 'Delivered and signed by receiver' });
  return h;
}

function shipment(
  id: string, customer: string, origin: string, destination: string, cargo: string, kg: number,
  vehicleId: string | undefined, driverId: string | undefined, status: ShipmentStatus, progress: number,
  createdH: number, etaH: number, deliveredH?: number,
): Shipment {
  return {
    id, customer, origin, destination, cargo, weightKg: kg, vehicleId, driverId, status, progress,
    customerPhone: `90${String(10000000 + Number(id.slice(3)) * 9137).slice(0, 8)}`,
    createdAt: ago(createdH), eta: inH(etaH),
    deliveredAt: status === 'delivered' ? ago(deliveredH ?? 1) : undefined,
    history: events(status, createdH, deliveredH),
  };
}

export const seedShipments: Shipment[] = [
  shipment('SH-3001', 'Reliance Retail', 'Hyderabad', 'Bengaluru', 'Packaged electronics', 8200, 'V-101', 'D-201', 'in_transit', 55, 9, 8),
  shipment('SH-3002', 'Flipkart Hub', 'Bengaluru', 'Chennai', 'Home appliances', 9100, 'V-102', 'D-202', 'in_transit', 32, 6, 6),
  shipment('SH-3003', 'BigBasket', 'Chennai', 'Hyderabad', 'Fresh produce', 4300, 'V-103', 'D-203', 'delayed', 42, 14, -2),
  shipment('SH-3004', 'Amazon FC', 'Mumbai', 'Pune', 'Mixed parcels', 9600, 'V-106', 'D-206', 'in_transit', 72, 5, 2),
  shipment('SH-3005', 'PepsiCo India', 'Vijayawada', 'Visakhapatnam', 'Beverages', 2900, 'V-107', 'D-207', 'delayed', 26, 8, -1),
  shipment('SH-3006', 'Asian Paints', 'Pune', 'Mumbai', 'Paint drums', 5400, 'V-104', 'D-204', 'delivered', 100, 30, -26, 22),
  shipment('SH-3007', 'DMart', 'Hyderabad', 'Nagpur', 'Groceries', 8800, 'V-101', 'D-201', 'delivered', 100, 52, -30, 31),
  shipment('SH-3008', 'Tata 1mg', 'Delhi', 'Hyderabad', 'Medical supplies', 3100, undefined, undefined, 'pending', 0, 2, 40),
  shipment('SH-3009', "Dr. Reddy's", 'Hyderabad', 'Mumbai', 'Pharma cartons', 1800, 'V-105', 'D-205', 'pending', 0, 3, 30),
  shipment('SH-3010', 'ITC Foods', 'Bengaluru', 'Hyderabad', 'Packaged foods', 7600, 'V-102', 'D-202', 'delivered', 100, 76, -60, 55),
  shipment('SH-3011', 'Godrej Consumer', 'Chennai', 'Bengaluru', 'Personal care', 4700, 'V-103', 'D-203', 'delivered', 100, 100, -80, 77),
  shipment('SH-3012', 'Myntra', 'Nagpur', 'Delhi', 'Apparel', 2200, undefined, undefined, 'cancelled', 0, 20, -10),
  shipment('SH-3013', 'Hindustan Unilever', 'Mumbai', 'Hyderabad', 'FMCG cartons', 9800, 'V-106', 'D-206', 'delivered', 100, 124, -90, 96),
  shipment('SH-3014', 'Nestlé India', 'Vijayawada', 'Chennai', 'Dairy', 3600, 'V-107', 'D-207', 'delivered', 100, 150, -120, 118),
];
