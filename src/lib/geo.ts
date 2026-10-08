export const CITIES: Record<string, { lat: number; lng: number }> = {
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Vijayawada: { lat: 16.5062, lng: 80.648 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Delhi: { lat: 28.6139, lng: 77.209 },
};
export const CITY_NAMES = Object.keys(CITIES);

export const W = 800;
export const H = 760;
const LNG: [number, number] = [68, 90];
const LAT: [number, number] = [7, 30.5];

export interface Pt { x: number; y: number }

export const project = (lat: number, lng: number): Pt => ({
  x: ((lng - LNG[0]) / (LNG[1] - LNG[0])) * W,
  y: ((LAT[1] - lat) / (LAT[1] - LAT[0])) * H,
});
export const cityPt = (name: string): Pt => {
  const c = CITIES[name] ?? CITIES.Hyderabad;
  return project(c.lat, c.lng);
};

export interface Route { a: Pt; b: Pt; c: Pt }
export function routeGeom(from: string, to: string): Route {
  const a = cityPt(from);
  const b = cityPt(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { a, b, c: { x: (a.x + b.x) / 2 - dy * 0.18, y: (a.y + b.y) / 2 + dx * 0.18 } };
}

const lerp = (p: Pt, q: Pt, t: number): Pt => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });

export function pointAt(r: Route, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * r.a.x + 2 * u * t * r.c.x + t * t * r.b.x,
    y: u * u * r.a.y + 2 * u * t * r.c.y + t * t * r.b.y,
  };
}
export const fullPath = (r: Route) => `M${r.a.x} ${r.a.y} Q${r.c.x} ${r.c.y} ${r.b.x} ${r.b.y}`;
export function partialPath(r: Route, t: number) {
  const q = lerp(r.a, r.c, t);
  const p = pointAt(r, t);
  return `M${r.a.x} ${r.a.y} Q${q.x} ${q.y} ${p.x} ${p.y}`;
}

export function distanceKm(from: string, to: string) {
  const A = CITIES[from];
  const B = CITIES[to];
  if (!A || !B) return 0;
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(B.lat - A.lat);
  const dLng = rad(B.lng - A.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(A.lat)) * Math.cos(rad(B.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25); // road factor
}

// Rough India outline as [lng, lat] — stylised, for the schematic map only.
export const OUTLINE: [number, number][] = [
  [74.5, 30.5], [77, 30.5], [79.5, 30.5], [81, 30], [84, 28.2], [88, 27.6], [89.5, 27], [89, 26], [88.6, 24],
  [88.8, 22.4], [87, 21.5], [85.4, 20], [83.5, 18], [82, 16.6], [80.3, 15.2], [80.2, 13], [79.9, 10.8],
  [78.2, 8.6], [77.3, 8.1], [76.3, 9.6], [75.2, 12], [74.4, 14.5], [73.5, 16.5], [72.9, 19.2], [72.7, 21],
  [70.6, 20.9], [69.2, 22.2], [68.4, 23.6], [70, 24.6], [71, 25.6], [70.3, 27.5], [72, 28.6], [73.8, 29.9],
];
