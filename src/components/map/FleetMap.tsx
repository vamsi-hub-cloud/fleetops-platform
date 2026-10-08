import { useMemo } from 'react';
import { CITIES, H, OUTLINE, W, cityPt, fullPath, partialPath, pointAt, project, routeGeom } from '../../lib/geo';
import type { Shipment, Vehicle } from '../../types';

interface Props {
  shipments: Shipment[];
  vehicles?: Vehicle[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  showVehicles?: boolean;
  className?: string;
}

const ACTIVE = ['in_transit', 'delayed'];
const VEHICLE_COLOR: Record<string, string> = { active: '#10b981', idle: '#94a3b8', maintenance: '#f59e0b', offline: '#475569' };

export function FleetMap({ shipments, vehicles = [], selectedId, onSelect, showVehicles = true, className }: Props) {
  const outline = OUTLINE.map(([lng, lat]) => { const p = project(lat, lng); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
  const routes = useMemo(() => shipments.filter((s) => s.status !== 'cancelled').map((s) => ({ s, g: routeGeom(s.origin, s.destination) })), [shipments]);
  const hasSel = routes.some((r) => r.s.id === selectedId);

  const markers = useMemo(() => {
    const out: { v: Vehicle; x: number; y: number; color: string; shipmentId?: string }[] = [];
    const perCity: Record<string, number> = {};
    for (const v of vehicles) {
      const r = routes.find((x) => x.s.vehicleId === v.id && ACTIVE.includes(x.s.status));
      if (r) {
        const p = pointAt(r.g, r.s.progress / 100);
        out.push({ v, ...p, color: r.s.status === 'delayed' ? '#ef4444' : '#0ea5e9', shipmentId: r.s.id });
      } else if (showVehicles) {
        const base = cityPt(v.location);
        const i = (perCity[v.location] = (perCity[v.location] ?? -1) + 1);
        out.push({ v, x: base.x + 14 + i * 14, y: base.y + 12, color: VEHICLE_COLOR[v.status] });
      }
    }
    return out;
  }, [vehicles, routes, showVehicles]);

  return (
    <div className={`relative overflow-hidden bg-sky-50 ${className ?? ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Fleet map of India showing routes and vehicles" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#bae6fd" strokeWidth="0.6" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <polygon points={outline} fill="#fff" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />

        {Object.keys(CITIES).map((c) => {
          const p = cityPt(c);
          return (
            <g key={c}>
              <circle cx={p.x} cy={p.y} r="3" fill="#94a3b8" />
              <text x={p.x + 7} y={p.y - 6} fontSize="12" fill="#64748b" style={{ paintOrder: 'stroke' }} stroke="#fff" strokeWidth="3">{c}</text>
            </g>
          );
        })}

        {routes.map(({ s, g }) => {
          const sel = s.id === selectedId;
          const dim = hasSel && !sel;
          const color = s.status === 'delayed' ? '#ef4444' : s.status === 'delivered' ? '#10b981' : '#0ea5e9';
          return (
            <g key={s.id} opacity={dim ? 0.25 : 1} className={onSelect ? 'cursor-pointer' : ''} onClick={() => onSelect?.(s.id)}>
              <path d={fullPath(g)} fill="none" stroke="transparent" strokeWidth="16" />
              <path d={fullPath(g)} fill="none" stroke={color} strokeWidth={sel ? 3 : 2} strokeDasharray="7 6" opacity="0.55" />
              {ACTIVE.includes(s.status) && <path d={partialPath(g, s.progress / 100)} fill="none" stroke={color} strokeWidth={sel ? 4 : 3} strokeLinecap="round" />}
              {(sel || !hasSel) && (
                <>
                  <rect x={g.a.x - 6} y={g.a.y - 6} width="12" height="12" rx="2" fill="#1d4ed8" stroke="#fff" strokeWidth="2"><title>{`Pickup: ${s.origin}`}</title></rect>
                  <circle cx={g.b.x} cy={g.b.y} r="7" fill="#fff" stroke="#059669" strokeWidth="3.5"><title>{`Delivery: ${s.destination}`}</title></circle>
                </>
              )}
            </g>
          );
        })}

        {markers.map((m) => {
          const sel = m.shipmentId && m.shipmentId === selectedId;
          return (
            <g key={m.v.id} transform={`translate(${m.x} ${m.y})`} className={m.shipmentId && onSelect ? 'cursor-pointer' : ''}
              onClick={() => m.shipmentId && onSelect?.(m.shipmentId)} opacity={hasSel && !sel && m.shipmentId ? 0.35 : 1}>
              {sel && <circle r="16" fill={m.color} opacity="0.25" className="animate-ping" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />}
              <circle r="9" fill={m.color} stroke="#fff" strokeWidth="2.5" />
              <path d="M-4 -2h5v5h-5zM1 0h3l1.5 1.5V3H1z" fill="#fff" />
              <title>{`${m.v.plate} · ${m.v.model}`}</title>
            </g>
          );
        })}
      </svg>
      <ul className="pointer-events-none absolute bottom-2 left-2 space-y-1 rounded-md bg-white/90 p-2 text-[11px] text-slate-600 shadow-sm">
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-blue-700" />Pickup</li>
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-600 bg-white" />Delivery</li>
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" />In transit</li>
        <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Delayed</li>
      </ul>
    </div>
  );
}
