import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Store, CreditCard, Users, Shield, 
  ChevronDown, Save, Check
} from 'lucide-react';
import api from '../api/service';

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

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const navItems = [
    { name: 'General', icon: <SettingsIcon size={18} /> },
    { name: 'Store', icon: <Store size={18} /> },
    { name: 'Payment', icon: <CreditCard size={18} /> },
    { name: 'Users', icon: <Users size={18} /> },
    { name: 'Security', icon: <Shield size={18} /> },
  ];

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
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings...</div>
          ) : (
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
