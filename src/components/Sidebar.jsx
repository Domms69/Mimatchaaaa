import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Tag, CreditCard, 
  Box, List, Truck, BarChart3, ClipboardList, PieChart, 
  Settings, UserCog, History, LogOut, Menu, Bell, Banknote, FileText
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('mimatcha_user');
    localStorage.removeItem('mimatcha_role');
    window.location.href = '/login';
  };

  const getUserInfo = () => {
    const user = localStorage.getItem('mimatcha_user');
    if (user) {
      return JSON.parse(user);
    }
    return { name: 'Kasir', email: 'kasir@mimatcha.id' };
  };

  const user = getUserInfo();
  const role = localStorage.getItem('mimatcha_role');

  const menuItems = [
    { section: 'DASHBOARD', items: [
      { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    ]},
    { section: 'SALES', items: [
      { name: 'Kasir POS', icon: <ShoppingCart size={20} />, path: '/pos' },
      { name: 'Orders', icon: <ClipboardList size={20} />, path: '/orders' },
      { name: 'Products', icon: <Package size={20} />, path: '/products' },
    ]},
    { section: 'BUSINESS', items: [
      { name: 'Kontrak', icon: <FileText size={20} />, path: '/contracts' },
    ]},
    { section: 'TOOLS', items: [
      { name: 'Analisis Uang', icon: <Banknote size={20} />, path: '/money-analyzer' },
    ]},
    { section: 'INVENTORY', items: [
      { name: 'Items', icon: <Box size={20} />, path: '/inventory' },
    ]},
    { section: 'REPORTS', items: [
      { name: 'Sales Report', icon: <BarChart3 size={20} />, path: '/reports' },
    ]},
    { section: 'SETTINGS', items: [
      { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ]},
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <div className="logo-icon">SP</div>
          <span className="brand-name">MIMATCHA</span>
        </div>
      </div>

      <nav className="sidebar-content">
        {menuItems.map((section, idx) => (
          <div key={idx} className="nav-section">
            <h3 className="section-title">{section.section}</h3>
            <ul className="nav-list">
              {section.items.map((item, itemIdx) => (
                <Link key={itemIdx} to={item.path || '#'} style={{ textDecoration: 'none' }}>
                  <li className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.name}</span>
                  </li>
                </Link>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" className="user-avatar" />
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          width: '100%',
          padding: '0.75rem',
          marginTop: '0.5rem',
          background: 'none',
          border: '1px solid #e74c3c',
          borderRadius: '8px',
          color: '#e74c3c',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}>
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
