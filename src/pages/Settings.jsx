import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Store, CreditCard, Users, Shield, 
  ChevronDown, Save, Check, Plus, X, Edit3, Trash2, Search,
  UserCog, Mail, Lock, User as UserIcon, Crown, UserCircle, Warehouse, BadgeDollarSign
} from 'lucide-react';
import api from '../api/service';

const ROLE_CONFIG = [
  { value: 'owner', label: 'Owner', icon: <Crown size={16} />, color: '#4c632d' },
  { value: 'kasir', label: 'Kasir', icon: <UserCircle size={16} />, color: '#2563eb' },
  { value: 'staff_gudang', label: 'Staff Gudang', icon: <Warehouse size={16} />, color: '#d97706' },
  { value: 'admin_keuangan', label: 'Admin Keuangan', icon: <BadgeDollarSign size={16} />, color: '#7c3aed' },
];

const getRoleBadge = (role) => {
  const config = ROLE_CONFIG.find(r => r.value === role);
  if (!config) return <span className="role-badge">{role}</span>;
  return (
    <span className="role-badge" style={{ background: config.color + '18', color: config.color, border: '1px solid ' + config.color + '30' }}>
      {config.icon} {config.label}
    </span>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    store_name: '',
    store_email: '',
    store_phone: '',
    store_currency: 'IDR',
    store_timezone: 'Asia/Jakarta',
    order_prefix: 'ORD-',
    auto_confirm_orders: 'true',
    low_stock_alert: 'true',
    low_stock_threshold: '10',
    allow_backorders: 'false',
    tax_calculation: 'inclusive',
    items_per_page: '25',
    enable_customer_accounts: 'true',
    maintenance_mode: 'false'
  });

  // User management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userForm, setUserForm] = useState({ nama: '', email: '', password: '', role: 'kasir' });

  useEffect(() => {
    fetchSettings();
    if (activeTab === 'Users') fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'Users') fetchUsers();
  }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const result = await api.getSettings();
      if (result.success && result.settings) {
        setSettings(prev => ({ ...prev, ...result.settings }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.updateSettings(settings);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ 
      ...prev, 
      [key]: prev[key] === 'true' ? 'false' : 'true' 
    }));
  };

  // User management functions
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await api.getUsers();
      if (result.success && Array.isArray(result.users)) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ nama: '', email: '', password: '', role: 'kasir' });
    setShowUserModal(true);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ nama: user.nama, email: user.email, password: '', role: user.role });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.nama || !userForm.email) {
      alert('Nama dan email wajib diisi');
      return;
    }
    if (!editingUser && !userForm.password) {
      alert('Password wajib diisi untuk user baru');
      return;
    }

    try {
      let result;
      if (editingUser) {
        result = await api.updateUser({ id: editingUser.id, ...userForm });
      } else {
        result = await api.addUser(userForm);
      }

      if (result.success) {
        setShowUserModal(false);
        fetchUsers();
      } else {
        alert('Gagal: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteUser = async (user) => {
    const currentUser = JSON.parse(localStorage.getItem('mimatcha_user') || '{}');
    if (currentUser.id === user.id) {
      alert('Tidak dapat menghapus akun sendiri');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus user "${user.nama}"?`)) return;

    try {
      const result = await api.deleteUser(user.id);
      if (result.success) {
        fetchUsers();
      } else {
        alert('Gagal menghapus user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(u =>
    u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const navItems = [
    { name: 'General', icon: <SettingsIcon size={18} /> },
    { name: 'Store', icon: <Store size={18} /> },
    { name: 'Payment', icon: <CreditCard size={18} /> },
    { name: 'Users', icon: <Users size={18} /> },
    { name: 'Security', icon: <Shield size={18} /> },
  ];

  const renderGeneralTab = () => (
    <>
      <div className="settings-section">
        <h2 className="settings-section-title">General Settings</h2>
        <p className="settings-section-desc">Configure basic information about your store.</p>
        
        <div className="settings-form-grid">
          <div className="form-field">
            <label>Store Name</label>
            <input 
              type="text" 
              value={settings.store_name} 
              onChange={(e) => updateSetting('store_name', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Store Email</label>
            <input 
              type="email" 
              value={settings.store_email}
              onChange={(e) => updateSetting('store_email', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Store Phone</label>
            <input 
              type="text" 
              value={settings.store_phone}
              onChange={(e) => updateSetting('store_phone', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Store Currency</label>
            <div className="select-wrapper">
              <select 
                value={settings.store_currency}
                onChange={(e) => updateSetting('store_currency', e.target.value)}
              >
                <option value="IDR">IDR - Indonesian Rupiah</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="form-field full-width">
            <label>Store Timezone</label>
            <div className="select-wrapper">
              <select 
                value={settings.store_timezone}
                onChange={(e) => updateSetting('store_timezone', e.target.value)}
              >
                <option value="Asia/Jakarta">(UTC+07:00) Jakarta, Bangkok, Hanoi</option>
                <option value="Asia/Makassar">(UTC+08:00) Makassar</option>
                <option value="Asia/Jayapura">(UTC+09:00) Jayapura</option>
                <option value="America/New_York">(UTC-05:00) Eastern Time</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Order Settings</h2>
        <p className="settings-section-desc">Configure order preferences and behavior.</p>
        
        <div className="settings-form-grid">
          <div className="form-field">
            <label>Order Prefix</label>
            <input 
              type="text" 
              value={settings.order_prefix}
              onChange={(e) => updateSetting('order_prefix', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Low Stock Threshold</label>
            <input 
              type="number" 
              value={settings.low_stock_threshold}
              onChange={(e) => updateSetting('low_stock_threshold', e.target.value)}
            />
          </div>
          <div className="toggle-field">
            <div className="toggle-text">
              <strong>Auto Confirm Orders</strong>
              <span>Automatically confirm orders after payment</span>
            </div>
            <Switch checked={settings.auto_confirm_orders === 'true'} onChange={() => toggleSetting('auto_confirm_orders')} />
          </div>
          <div className="toggle-field">
            <div className="toggle-text">
              <strong>Low Stock Alert</strong>
              <span>Get notified when product stock is low</span>
            </div>
            <Switch checked={settings.low_stock_alert === 'true'} onChange={() => toggleSetting('low_stock_alert')} />
          </div>
          <div className="toggle-field">
            <div className="toggle-text">
              <strong>Allow Backorders</strong>
              <span>Allow customers to place backorders</span>
            </div>
            <Switch checked={settings.allow_backorders === 'true'} onChange={() => toggleSetting('allow_backorders')} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Other Settings</h2>
        <p className="settings-section-desc">Additional preferences for your store.</p>
        
        <div className="settings-form-grid">
          <div className="form-field">
            <label>Tax Calculation</label>
            <div className="select-wrapper">
              <select 
                value={settings.tax_calculation}
                onChange={(e) => updateSetting('tax_calculation', e.target.value)}
              >
                <option value="inclusive">Inclusive Tax</option>
                <option value="exclusive">Exclusive Tax</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="form-field">
            <label>Default Items Per Page</label>
            <div className="select-wrapper">
              <select 
                value={settings.items_per_page}
                onChange={(e) => updateSetting('items_per_page', e.target.value)}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="toggle-field">
            <div className="toggle-text">
              <strong>Enable Customer Accounts</strong>
              <span>Allow customers to create accounts</span>
            </div>
            <Switch checked={settings.enable_customer_accounts === 'true'} onChange={() => toggleSetting('enable_customer_accounts')} />
          </div>
          <div className="toggle-field">
            <div className="toggle-text">
              <strong>Maintenance Mode</strong>
              <span>Temporarily disable store access</span>
            </div>
            <Switch checked={settings.maintenance_mode === 'true'} onChange={() => toggleSetting('maintenance_mode')} />
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saved ? (
            <>
              <Check size={18} /> Saved!
            </>
          ) : (
            <>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </>
          )}
        </button>
      </div>
    </>
  );

  const renderUsersTab = () => (
    <div className="users-management">
      <div className="settings-section">
        <div className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="settings-section-title" style={{ margin: 0 }}>Manage Users</h2>
            <p className="settings-section-desc" style={{ margin: '0.25rem 0 0 0' }}>Add, edit, and manage user accounts and their roles.</p>
          </div>
          <button className="add-product-btn" onClick={openAddUser}>
            <Plus size={18} /> Add User
          </button>
        </div>

        <div className="search-box" style={{ marginBottom: '1.25rem', maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        {usersLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</div>
        ) : (
          <div className="users-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#4c632d', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: '700'
                        }}>
                          {user.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.nama}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.9rem' }}>{user.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{getRoleBadge(user.role)}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="edit-btn-sm" onClick={() => openEditUser(user)}
                          style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#475569' }}>
                          <Edit3 size={14} /> Edit
                        </button>
                        <button className="delete-btn-sm" onClick={() => handleDeleteUser(user)}
                          style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#dc2626' }}>
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      {users.length === 0 ? 'Belum ada user. Klik "Add User" untuk menambahkan.' : 'Tidak ada user yang cocok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Add/Edit Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="close-btn" onClick={() => setShowUserModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={userForm.nama}
                    onChange={e => setUserForm({...userForm, nama: e.target.value})}
                    placeholder="Nama user"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>{editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={userForm.password}
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Role</label>
                <select 
                  className="input-field"
                  value={userForm.role}
                  onChange={e => setUserForm({...userForm, role: e.target.value})}
                >
                  {ROLE_CONFIG.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {editingUser && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534' }}>
                  <strong>Info:</strong> Password hanya diisi jika ingin diganti.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveUser}>
                <UserCog size={16} /> {editingUser ? 'Update User' : 'Simpan User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .users-table tr:hover td {
          background: #f8fafc;
        }
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );

  const renderPlaceholderTab = (title) => (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      <p className="settings-section-desc">This section is under development.</p>
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', marginTop: '1rem' }}>
        <SettingsIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p>{title} settings coming soon.</p>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <header className="main-header">
        <div className="header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your store configuration and preferences.</p>
        </div>
      </header>

      <div className="settings-container">
        <aside className="settings-nav">
          {navItems.map((item) => (
            <button 
              key={item.name} 
              className={`settings-nav-item ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => setActiveTab(item.name)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </aside>

        <section className="settings-content">
          {loading && activeTab !== 'Users' ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings...</div>
          ) : (
            <>
              {activeTab === 'General' && renderGeneralTab()}
              {activeTab === 'Store' && renderPlaceholderTab('Store')}
              {activeTab === 'Payment' && renderPlaceholderTab('Payment')}
              {activeTab === 'Users' && renderUsersTab()}
              {activeTab === 'Security' && renderPlaceholderTab('Security')}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const Switch = ({ checked, onChange }) => (
  <label className="switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="slider"></span>
  </label>
);

export default Settings;
