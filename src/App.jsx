import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MyWork from './pages/MyWork';
import DemoTracker from './pages/DemoTracker';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import DemoManagement from './pages/DemoManagement';
import ConvertedLeads from './pages/ConvertedLeads';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import InternActivity from './pages/InternActivity';
import InternControl from './pages/InternControl';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-work" element={<MyWork />} />
            <Route path="/demos" element={<DemoTracker />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/demo-management" element={<DemoManagement />} />
            <Route path="/converted-leads" element={<ConvertedLeads />} />
            <Route path="/reports" element={<Reports />} />
            {/* <Route path="/analytics" element={<AnalyticsDashboard />} /> */}
            <Route path="/intern-activity" element={<InternActivity />} />
            <Route path="/intern-control" element={<InternControl />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
