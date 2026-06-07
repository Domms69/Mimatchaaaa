import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Invoice from './pages/Invoice';
import Contracts from './pages/Contracts';
import ContractForm from './pages/ContractForm';
import ContractDetail from './pages/ContractDetail';
import ReceiptPage from './pages/ReceiptPage';
import Landing from './pages/Landing';
import './index.css';

// Permission matrix per role
const ROLE_PERMISSIONS = {
  owner: {
    allowedRoutes: ['*'], // all access
    defaultRoute: '/dashboard'
  },
  kasir: {
    allowedRoutes: ['/pos', '/checkout', '/orders', '/receipt'],
    defaultRoute: '/pos'
  },
  staff_gudang: {
    allowedRoutes: ['/inventory', '/products'],
    defaultRoute: '/inventory'
  },
  admin_keuangan: {
    allowedRoutes: ['/dashboard', '/orders', '/reports', '/contracts', '/invoice', '/receipt'],
    defaultRoute: '/dashboard'
  },
  user: {
    allowedRoutes: ['/'],
    defaultRoute: '/'
  }
};

function hasPermission(role, pathname) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.allowedRoutes.includes('*')) return true;
  // Check if path starts with any allowed route
  return permissions.allowedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

function getDefaultRoute(role) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.defaultRoute || '/pos';
}

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-top-bar">
          <NotificationBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const role = localStorage.getItem('mimatcha_role');
  const isAuthenticated = localStorage.getItem('mimatcha_user');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(role, location.pathname)) {
    const defaultRoute = getDefaultRoute(role);
    return (
      <div className="access-denied-modal">
        <div className="modal-content">
          <div className="modal-icon">🚫</div>
          <h3>Akses Ditolak</h3>
          <p>Halaman ini tidak dapat diakses oleh role Anda.</p>
          <button onClick={() => window.location.href = defaultRoute}>Kembali</button>
        </div>
      </div>
    );
  }

  return children;
}

function LoginRoute() {
  const isAuthenticated = localStorage.getItem('mimatcha_user');
  const role = localStorage.getItem('mimatcha_role');
  
  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }
  
  return <Login />;
}

function PublicLanding() {
  return <Landing />;
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          
          {/* Dashboard Routes with Persistent Sidebar */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/edit/:id" element={<ContractForm />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
          </Route>

          {/* Receipt Page - No Sidebar */}
          <Route path="/receipt/:orderId" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
          
          <Route path="/invoice" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          
          {/* Landing Page (Public) */}
          <Route path="/" element={<PublicLanding />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
}

export default App;
