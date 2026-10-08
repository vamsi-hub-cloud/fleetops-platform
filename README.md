# FleetOps — Logistics & Fleet Tracking Platform

React 18 + TypeScript + Tailwind CSS + React Router. Runs on mock data out of the box and is ready for a real API.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## Screens

| Route | What it does |
| --- | --- |
| `/` | KPIs, shipment status split, 7-day delivery chart, on-time rate, fleet performance, alerts, recent activity |
| `/vehicles`, `/vehicles/:id` | CRUD, driver assignment, fuel + maintenance, activity history, trips |
| `/drivers`, `/drivers/:id` | Profiles, availability, assigned vehicle, performance metrics, delivery history |
| `/shipments`, `/shipments/:id` | Create/edit/delete, status workflow, route map, delivery timeline |
| `/tracking` | Interactive map: routes, pickup/delivery points, vehicle positions, ETA and distance left |
| `/notifications` | Delay, maintenance, delivery and driver alerts with read state; bell dropdown in the top bar |

Filters: vehicles (search, status, driver, location, service-due date), drivers (search, status, vehicle, base, joined date), shipments (search, status, driver, vehicle, location, date range).

## Structure

```
src/
  components/
    ui/        Button, Badge, Card, Modal, Field, DataTable, empty/error/skeleton states
    layout/    Responsive shell: sidebar drawer, top bar, notification bell, global loading/error gate
    map/       FleetMap (dependency-free SVG map)
    forms/     Vehicle / Driver / Shipment modals with validation
  pages/       One file per route
  store/       AppContext (useReducer): data, CRUD actions, derived notifications
  services/    api.ts — the only file that talks to a backend
  hooks/       useForm (validation + submit state)
  lib/         utils, geo helpers, notification rules
  data/        Mock seed data
  types/       Domain types
```

## Connecting a real backend

1. Copy `.env.example` to `.env` and set `VITE_API_URL=https://your-api.example.com`.
2. `src/services/api.ts` then issues REST calls: `GET/POST /vehicles`, `PATCH/DELETE /vehicles/:id`, and the same for `/drivers` and `/shipments`.
3. For live positions, replace the progress-based vehicle placement in `components/map/FleetMap.tsx` with GPS coordinates from your API or a websocket, and swap the SVG map for Leaflet/Mapbox if you need street-level detail. Its props (`shipments`, `vehicles`, `selectedId`, `onSelect`) can stay the same.

## Notes

- Alerts are derived from data (delayed shipments, service due/overdue, low fuel, unavailable drivers). Move the rules to the server if you want them persisted.
- Read/unread alert state is kept in memory only.
