import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ClientAuthProvider } from './lib/clientAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedClientRoute } from './components/ProtectedClientRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { Clients } from './pages/Clients';
import { Invoices } from './pages/Invoices';
import {
  PortalLogin,
  PortalDashboard,
  PortalSessions,
  PortalInvoices,
} from './pages/portal';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClientAuthProvider>
          <Routes>
            {/* Staff public routes */}
            <Route path="/login" element={<Login />} />

            {/* Staff protected routes */}
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
              <Route path="clients" element={<Clients />} />
              <Route path="invoices" element={<Invoices />} />
            </Route>

            {/* Client Portal public routes */}
            <Route path="/portal/login" element={<PortalLogin />} />

            {/* Client Portal protected routes */}
            <Route
              path="/portal"
              element={
                <ProtectedClientRoute>
                  <PortalDashboard />
                </ProtectedClientRoute>
              }
            />
            <Route
              path="/portal/sessions"
              element={
                <ProtectedClientRoute>
                  <PortalSessions />
                </ProtectedClientRoute>
              }
            />
            <Route
              path="/portal/invoices"
              element={
                <ProtectedClientRoute>
                  <PortalInvoices />
                </ProtectedClientRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </ClientAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
