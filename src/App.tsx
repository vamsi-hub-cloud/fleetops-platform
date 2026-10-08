import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { EmptyState } from './components/ui';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Shipments from './pages/Shipments';
import ShipmentDetail from './pages/ShipmentDetail';
import Tracking from './pages/Tracking';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="drivers/:id" element={<DriverDetail />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="tracking" element={<Tracking />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<EmptyState icon="map" title="Page not found" message="This address doesn’t match any screen." action={<Link className="text-sm font-medium text-brand-600" to="/">Back to dashboard</Link>} />} />
      </Route>
    </Routes>
  );
}
