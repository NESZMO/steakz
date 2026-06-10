import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/public/Home.Page';
import MenuPage from './pages/public/MenuPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import HQDashboard from './pages/headquaters/HQDashboard';
import BranchDashboard from './pages/branch-manager/BranchDashboard';
import ChefDashboard from './pages/chef/ChefDashboard';
import CashierDashboard from './pages/cashier/CashierDashboard';
import WaiterDashboard from './pages/waiter/WaiterDashboard';

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    ADMIN: '/admin',
    HQ_MANAGER: '/hq',
    BRANCH_MANAGER: '/branch',
    CHEF: '/chef',
    CASHIER: '/cashier',
    WAITER: '/waiter',
  };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['HQ_MANAGER']} />}>
            <Route path="/hq/*" element={<HQDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['BRANCH_MANAGER']} />}>
            <Route path="/branch/*" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['CHEF']} />}>
            <Route path="/chef/*" element={<ChefDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['CASHIER']} />}>
            <Route path="/cashier/*" element={<CashierDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['WAITER']} />}>
            <Route path="/waiter/*" element={<WaiterDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
