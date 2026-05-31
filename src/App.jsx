import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
import MoneyAnalyzer from './pages/MoneyAnalyzer';
import Contracts from './pages/Contracts';
import ContractForm from './pages/ContractForm';
import ContractDetail from './pages/ContractDetail';
import ReceiptPage from './pages/ReceiptPage';
import './index.css';

const kasirAllowedRoutes = ['/pos', '/checkout', '/receipt'];

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
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

  if (role !== 'owner' && !kasirAllowedRoutes.includes(location.pathname) && !location.pathname.startsWith('/receipt')) {
    return (
      <div className="access-denied-modal">
        <div className="modal-content">
          <div className="modal-icon">🚫</div>
          <h3>Akses Ditolak</h3>
          <p>Halaman ini hanya dapat diakses oleh Owner/Admin.</p>
          <button onClick={() => window.location.href = '/pos'}>Kembali ke POS</button>
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
    if (role === 'owner') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/pos" replace />;
    }
  }
  
  return <Login />;
}

function App() {
  return (
    <Router>
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
          <Route path="/money-analyzer" element={<MoneyAnalyzer />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/new" element={<ContractForm />} />
          <Route path="/contracts/edit/:id" element={<ContractForm />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
        </Route>

        {/* Receipt Page - No Sidebar */}
        <Route path="/receipt/:orderId" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
        
        <Route path="/invoice" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
