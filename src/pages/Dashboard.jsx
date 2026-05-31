import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, 
  DollarSign, MoreHorizontal, AlertCircle, Bell, Search, Calendar, ChevronDown, Check, X,
  Package, Activity, FileText
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import api from '../api/service';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendapatan_hari_ini: 0,
    pendapatan_bulan: 0,
    total_pesanan_hari_ini: 0,
    total_pelanggan: 0,
    pesanan_terbaru: [],
    produk_terlaris: []
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('This Week (May 12 - May 18)');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResult, analyticsResult, inventoryResult, expiringContractsResult] = await Promise.all([
        api.getDashboardStats(),
        api.getAnalytics('weekly'),
        api.getInventory(),
        api.getExpiringContracts(30)
      ]);
      
      if (statsResult) {
        setStats(statsResult);
      }
      
      if (analyticsResult && analyticsResult.penjualan) {
        const chartData = analyticsResult.penjualan.map(item => ({
          name: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          sales: parseFloat(item.total)
        }));
        setSalesData(chartData);
      }

      // Generate Real Notifications
      const newNotifications = [];
      
      // 1. Recent Orders Notifications (Last 3)
      if (statsResult?.pesanan_terbaru) {
        statsResult.pesanan_terbaru.slice(0, 3).forEach(order => {
          newNotifications.push({
            id: `order-${order.id_pesanan}`,
            text: `New order #${order.id_pesanan} from ${order.nama_pelanggan || 'Guest'}`,
            time: 'Recently',
            icon: <ShoppingBag size={14}/>,
            type: 'order',
            link: '/orders'
          });
        });
      }

      // 2. Low Stock Notifications
      if (inventoryResult) {
        const lowStockItems = inventoryResult.filter(item => item.stok > 0 && item.stok <= 10);
        if (lowStockItems.length > 0) {
          newNotifications.push({
            id: 'low-stock-alert',
            text: `${lowStockItems.length} items are running low on stock`,
            time: 'Check Now',
            icon: <AlertCircle size={14}/>,
            type: 'alert',
            link: '/inventory'
          });
        }
      }

      // 3. Notifikasi Kontrak Akan Berakhir
      if (expiringContractsResult && expiringContractsResult.length > 0) {
        expiringContractsResult.forEach(contract => {
          const daysLeft = Math.ceil(
            (new Date(contract.masa_berlaku) - new Date()) / (1000 * 60 * 60 * 24)
          );
          newNotifications.push({
            id: `contract-${contract.id_kontrak}`,
            text: `Kontrak ${contract.nomor_kontrak} berakhir dalam ${daysLeft} hari`,
            time: `${daysLeft} hari lagi`,
            icon: <AlertCircle size={14}/>,
            type: 'warning',
            link: `/contracts/${contract.id_kontrak}`
          });
        });
      }

      // 3. Analytics Insight
      if (analyticsResult?.penjualan) {
        newNotifications.push({
          id: 'report-ready',
          text: 'Weekly sales report is ready for review',
          time: 'Today',
          icon: <Activity size={14}/>,
          type: 'report',
          link: '/reports'
        });
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = () => {
    setUnreadCount(0);
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    navigate(link);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'lunas': { label: 'Selesai', class: 'completed' },
      'pending': { label: 'Menunggu', class: 'pending' },
      'batal': { label: 'Batal', class: 'cancelled' }
    };
    return statusMap[status] || { label: status, class: 'pending' };
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <>
      <header className="main-header">
        <div className="header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, Admin! Here's what's happening with your store today.</p>
        </div>
        <div className="header-right">
          <div className="date-picker-wrapper" style={{ position: 'relative' }}>
            <div className="date-picker" onClick={() => setShowDatePicker(!showDatePicker)}>
              <Calendar size={18} />
              <span>{selectedPeriod}</span>
              <ChevronDown size={16} />
            </div>
            {showDatePicker && (
              <div className="dropdown-menu date-dropdown">
                <div className="dropdown-item" onClick={() => { setSelectedPeriod('Today'); setShowDatePicker(false); }}>Today</div>
                <div className="dropdown-item" onClick={() => { setSelectedPeriod('This Week (May 12 - May 18)'); setShowDatePicker(false); }}>This Week</div>
                <div className="dropdown-item" onClick={() => { setSelectedPeriod('This Month (May)'); setShowDatePicker(false); }}>This Month</div>
                <div className="dropdown-item" onClick={() => { setSelectedPeriod('This Year (2025)'); setShowDatePicker(false); }}>This Year</div>
              </div>
            )}
          </div>

          <div className="notification-wrapper" style={{ position: 'relative' }}>
            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="dropdown-menu notification-dropdown">
                <div className="dropdown-header">
                  <span>Notifications</span>
                  <button className="mark-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="notif-item" onClick={() => handleNotificationClick(n.link)}>
                        <div className={`notif-icon ${n.type}`}>{n.icon}</div>
                        <div className="notif-info">
                          <p className="notif-text">{n.text}</p>
                          <span className="notif-time">{n.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                      No new notifications
                    </div>
                  )}
                </div>
                <div className="dropdown-footer">
                  <button onClick={() => handleNotificationClick('/reports')}>View all activity</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard title="Pendapatan Hari Ini" value={formatRupiah(stats.pendapatan_hari_ini)} trend="+12.5%" icon={<ShoppingBag />} color="green" />
        <StatCard title="Pesanan Hari Ini" value={stats.total_pesanan_hari_ini.toString()} trend="+8.3%" icon={<DollarSign />} color="orange" />
        <StatCard title="Total Pelanggan" value={stats.total_pelanggan.toString()} trend="+6.7%" icon={<Users />} color="blue" />
        <StatCard title="Pendapatan Bulan Ini" value={formatRupiah(stats.pendapatan_bulan)} trend="+15.2%" icon={<TrendingUp />} color="purple" />
      </section>

      <section className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Sales Overview</h3>
            <select className="chart-select"><option>This Week</option></select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4c632d" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4c632d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#4c632d" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <h3>Orders Overview</h3>
            <select className="chart-select"><option>This Week</option></select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#4c632d" strokeWidth={2} dot={{fill: '#4c632d', r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="table-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="view-all" onClick={() => navigate('/orders')}>View All Orders</button>
          </div>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.pesanan_terbaru && stats.pesanan_terbaru.length > 0 ? (
                  stats.pesanan_terbaru.map((order, idx) => {
                    const statusInfo = getStatusBadge(order.status_pesanan);
                    return (
                      <tr key={idx}>
                        <td className="order-id">#{order.id_pesanan}</td>
                        <td>{order.nama_pelanggan || 'Guest'}</td>
                        <td className="date-cell">{new Date(order.tanggal_pesanan).toLocaleDateString('id-ID')}</td>
                        <td>
                          <span className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="total-cell">{formatRupiah(order.total_pembayaran)}</td>
                        <td><button className="action-btn"><MoreHorizontal size={16} /></button></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#999'}}>
                      Belum ada pesanan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="side-cards">
          <div className="product-card">
            <div className="card-header">
              <h3>Top Selling Products</h3>
              <button className="view-all" onClick={() => navigate('/products')}>View All</button>
            </div>
            <ul className="product-list">
              {stats.produk_terlaris && stats.produk_terlaris.length > 0 ? (
                stats.produk_terlaris.map((product, idx) => (
                  <li key={idx} className="product-item">
                    <div className="rank">{idx + 1}</div>
                    <div className="product-img" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4c632d, #6b8e23)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {product.nama_produk.charAt(0)}
                    </div>
                    <div className="product-info">
                      <span className="product-name">{product.nama_produk}</span>
                      <span className="product-cat">{formatRupiah(product.total_pendapatan)}</span>
                    </div>
                    <div className="product-stats">
                      <span className="sold-count">{product.total_terjual}</span>
                      <span className="sold-label">Sold</span>
                    </div>
                  </li>
                ))
              ) : (
                <li style={{textAlign: 'center', padding: '2rem', color: '#999'}}>
                  Belum ada data produk
                </li>
              )}
            </ul>
          </div>

          <div className="alert-card">
            <div className="card-header">
              <h3>Low Stock Alerts</h3>
              <button className="view-all" onClick={() => navigate('/inventory')}>View All</button>
            </div>
            <div className="alert-content">
              <div className="alert-icon-box">
                <AlertCircle size={24} color="#e74c3c" />
              </div>
              <div className="alert-text">
                <p>8 items are running low on stock.</p>
                <span>Check inventory to restock.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>© 2025 QuickPOS. All rights reserved.</p>
        <span>Version 1.0.0</span>
      </footer>
    </>
  );
};

const StatCard = ({ title, value, trend, icon, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-header">
      <div className="stat-icon">{icon}</div>
      <span className="stat-title">{title}</span>
    </div>
    <div className="stat-content">
      <h2 className="stat-value">{value}</h2>
      <div className="stat-trend positive">
        <TrendingUp size={14} /> 
        <span>{trend}</span>
        <span className="trend-label">from last week</span>
      </div>
    </div>
  </div>
);

export default Dashboard;
