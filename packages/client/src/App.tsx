import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { Clients } from './pages/Clients';
import { Invoices } from './pages/Invoices';
import Rooms from './pages/Rooms';
import Equipment from './pages/Equipment';
import Projects from './pages/Projects';
import Tracks from './pages/Tracks';
import Talents from './pages/Talents';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="clients" element={<Clients />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tracks" element={<Tracks />} />
          <Route path="talents" element={<Talents />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
