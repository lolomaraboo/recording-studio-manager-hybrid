import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import { Clients } from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import { Invoices } from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import Projects from './pages/Projects';
import Tracks from './pages/Tracks';
import Talents from './pages/Talents';
import Calendar from './pages/Calendar';
import AudioFiles from './pages/AudioFiles';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="equipment/:id" element={<EquipmentDetail />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tracks" element={<Tracks />} />
          <Route path="talents" element={<Talents />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="audio-files" element={<AudioFiles />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
