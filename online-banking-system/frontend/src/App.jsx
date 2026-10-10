import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import DashboardPage from './pages/DashboardPage';
import AccountDetailPage from './pages/AccountDetailPage';
import ProfilePage from './pages/ProfilePage';
import BeneficiariesPage from './pages/BeneficiariesPage';
import TransferPage from './pages/TransferPage';
import BillsPage from './pages/BillsPage';
import DepositsPage from './pages/DepositsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OtpPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts/:id" element={<AccountDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/beneficiaries" element={<BeneficiariesPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/deposits" element={<DepositsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
