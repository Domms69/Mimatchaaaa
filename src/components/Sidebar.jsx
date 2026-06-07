import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Tag, CreditCard, 
  Box, List, Truck, BarChart3, ClipboardList, PieChart, 
  Settings, UserCog, History, LogOut, Menu, Bell, FileText,
  Crown, UserCircle, Warehouse, BadgeDollarSign, Home
} from 'lucide-react';

// Role-based menu visibility
const ROLE_MENU_ACCESS = {
  owner: '*',
  kasir: ['/pos', '/orders', '/receipt'],
  staff_gudang: ['/inventory', '/products'],
  admin_keuangan: ['/dashboard', '/orders', '/contracts', '/reports'],
  user: []
};

function hasMenuAccess(role, path) {
  if (role === 'owner') return true;
  const allowed = ROLE_MENU_ACCESS[role];
  if (!allowed) return false;
  return allowed.some(route => path === route || path.startsWith(route + '/'));
}

const ROLE_CONFIG = [
  { value: 'owner', label: 'Owner', icon: <Crown size={14} />, color: '#4c632d' },
  { value: 'kasir', label: 'Kasir', icon: <UserCircle size={14} />, color: '#2563eb' },
  { value: 'staff_gudang', label: 'Staff Gudang', icon: <Warehouse size={14} />, color: '#d97706' },
  { value: 'admin_keuangan', label: 'Admin Keuangan', icon: <BadgeDollarSign size={14} />, color: '#7c3aed' },
];

const getRoleInfo = (role) => ROLE_CONFIG.find(r => r.value === role) || ROLE_CONFIG[0];

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
    return { name: 'User', email: 'user@mimatcha.id' };
  };

  const user = getUserInfo();
  const role = localStorage.getItem('mimatcha_role');
  const roleInfo = getRoleInfo(role);

  const menuItems = [
    { section: 'DASHBOARD', items: [
      { name: 'Beranda', icon: <Home size={20} />, path: '/' },
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

  // Filter menu items by role
  const filteredMenuItems = menuItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasMenuAccess(role, item.path))
    }))
    .filter(section => section.items.length > 0);

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo-link">
          <div className="logo-wrapper">
            <img src="/LogoM.jpeg" alt="MiMatcha" className="sidebar-logo" />
            <span className="brand-name">Mimatcha</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-content">
        {filteredMenuItems.map((section, idx) => (
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
            <span className="user-role-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.7rem', fontWeight: 600, marginTop: '2px',
              color: roleInfo.color
            }}>
              {roleInfo.icon} {roleInfo.label}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
