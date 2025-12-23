import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import SessionCreate from './pages/SessionCreate';
import { Clients } from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import ClientCreate from './pages/ClientCreate';
import { Invoices } from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceCreate from './pages/InvoiceCreate';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import RoomCreate from './pages/RoomCreate';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentCreate from './pages/EquipmentCreate';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import Tracks from './pages/Tracks';
import TrackDetail from './pages/TrackDetail';
import Talents from './pages/Talents';
import TalentDetail from './pages/TalentDetail';
import TalentCreate from './pages/TalentCreate';
import { Quotes } from './pages/Quotes';
import QuoteCreate from './pages/QuoteCreate';
import { Contracts } from './pages/Contracts';
import ContractCreate from './pages/ContractCreate';
import { Expenses } from './pages/Expenses';
import ExpenseCreate from './pages/ExpenseCreate';
import ExpenseDetail from './pages/ExpenseDetail';
import QuoteDetail from './pages/QuoteDetail';
import ContractDetail from './pages/ContractDetail';
import TrackCreate from './pages/TrackCreate';
import Calendar from './pages/Calendar';
import AudioFiles from './pages/AudioFiles';
import FinancialReports from './pages/FinancialReports';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import { ClientPortalLayout } from './components/client-portal/ClientPortalLayout';
import ClientLogin from './pages/client-portal/ClientLogin';
import ClientDashboard from './pages/client-portal/ClientDashboard';
import Bookings from './pages/client-portal/Bookings';
import BookingDetail from './pages/client-portal/BookingDetail';
import Profile from './pages/client-portal/Profile';
import MagicLinkVerify from './pages/auth/MagicLinkVerify';
import {
  ClientPortalAuthProvider,
  ProtectedClientRoute,
} from './contexts/ClientPortalAuthContext';

function App() {
  return (
    <BrowserRouter>
      <ClientPortalAuthProvider>
        <Routes>
          {/* Staff Portal - Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Client Portal - Public routes */}
          <Route path="/client-portal/login" element={<ClientLogin />} />
          <Route path="/auth/magic-link" element={<MagicLinkVerify />} />

          {/* Client Portal - Protected routes */}
          <Route
            path="/client-portal"
            element={
              <ProtectedClientRoute>
                <ClientPortalLayout />
              </ProtectedClientRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="profile" element={<Profile />} />
            {/* TODO: Add more client portal routes (invoices, projects, payments) */}
          </Route>

          {/* Staff Portal - Protected routes */}
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
            <Route path="sessions/new" element={<SessionCreate />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientCreate />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceCreate />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="rooms/new" element={<RoomCreate />} />
            <Route path="rooms/:id" element={<RoomDetail />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="equipment/new" element={<EquipmentCreate />} />
            <Route path="equipment/:id" element={<EquipmentDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<ProjectCreate />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tracks" element={<Tracks />} />
            <Route path="tracks/new" element={<TrackCreate />} />
            <Route path="tracks/:id" element={<TrackDetail />} />
            <Route path="talents" element={<Talents />} />
            <Route path="talents/new" element={<TalentCreate />} />
            <Route path="talents/:id" element={<TalentDetail />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/new" element={<QuoteCreate />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/new" element={<ContractCreate />} />
            <Route path="contracts/:id" element={<ContractDetail />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/new" element={<ExpenseCreate />} />
            <Route path="expenses/:id" element={<ExpenseDetail />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="audio-files" element={<AudioFiles />} />
            <Route path="financial-reports" element={<FinancialReports />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="team" element={<Team />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster />
      </ClientPortalAuthProvider>
    </BrowserRouter>
  );
}

export default App;
