import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, ShoppingBag, 
  MoreHorizontal, AlertCircle,
  Clock, ShoppingCart, BarChart3
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
  const [lowStockCount, setLowStockCount] = useState(0);

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

      // Hitung stok rendah
      if (inventoryResult) {
        const lowStock = inventoryResult.filter(item => item.stok > 0 && item.stok <= 10);
        setLowStockCount(lowStock.length);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'lunas': { label: 'Lunas', class: 'completed' },
      'pending': { label: 'Pending', class: 'pending' },
      'batal': { label: 'Dibatalkan', class: 'cancelled' },
      'selesai': { label: 'Selesai', class: 'completed' },
      'diproses': { label: 'Diproses', class: 'processing' }
    };
    return statusMap[status] || { label: status, class: 'pending' };
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner-dash"></div>
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <header className="main-header">
        <div className="header-left">
          <div className="greeting-section">
            <h1 className="page-title">Selamat Datang, Admin 👋</h1>
            <p className="page-subtitle">Ringkasan bisnis MiMatcha Anda hari ini</p>
          </div>
          <div className="header-date">
            <Clock size={14} />
            <span>{today}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="admin-avatar">
            <span>MA</span>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard title="Pendapatan Hari Ini" value={formatRupiah(stats.pendapatan_hari_ini)} trend="dari kemarin" icon={<ShoppingBag size={20} />} color="green" />
        <StatCard title="Pesanan Hari Ini" value={stats.total_pesanan_hari_ini.toString()} trend="dari kemarin" icon={<ShoppingCart size={20} />} color="blue" />
        <StatCard title="Total Pelanggan" value={stats.total_pelanggan.toString()} trend="pelanggan terdaftar" icon={<Users size={20} />} color="purple" />
        <StatCard title="Pendapatan Bulan Ini" value={formatRupiah(stats.pendapatan_bulan)} trend="dari bulan lalu" icon={<BarChart3 size={20} />} color="orange" />
      </section>

      <section className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ringkasan Penjualan</h3>
            <span className="chart-badge">Minggu Ini</span>
          </div>
          <div className="chart-container">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4c632d" stopOpacity={0.12}/>
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
            ) : (
              <div className="chart-empty">Belum ada data penjualan</div>
            )}
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <h3>Ringkasan Pesanan</h3>
            <span className="chart-badge">Minggu Ini</span>
          </div>
          <div className="chart-container">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#4c632d" strokeWidth={2} dot={{fill: '#4c632d', r: 4, strokeWidth: 0}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">Belum ada data pesanan</div>
            )}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="table-card">
          <div className="card-header">
            <h3>Pesanan Terbaru</h3>
            <button className="view-all" onClick={() => navigate('/orders')}>Lihat Semua</button>
          </div>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Pelanggan</th>
                  <th>Tanggal</th>
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
                        <td>{order.nama_pelanggan || 'Tamu'}</td>
                        <td className="date-cell">{new Date(order.tanggal_pesanan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <span className={`status-badge ${statusInfo.class}`}>
                            <span className="status-dot"></span>
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
                    <td colSpan="6" className="empty-table">
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
              <h3>Produk Terlaris</h3>
              <button className="view-all" onClick={() => navigate('/products')}>Lihat Semua</button>
            </div>
            <ul className="product-list">
              {stats.produk_terlaris && stats.produk_terlaris.length > 0 ? (
                stats.produk_terlaris.map((product, idx) => (
                  <li key={idx} className="product-item">
                    <div className={`rank rank-${idx + 1}`}>{idx + 1}</div>
                    <div className="product-img">
                      {product.nama_produk.charAt(0)}
                    </div>
                    <div className="product-info">
                      <span className="product-name">{product.nama_produk}</span>
                      <span className="product-cat">{formatRupiah(product.total_pendapatan)}</span>
                    </div>
                    <div className="product-stats">
                      <span className="sold-count">{product.total_terjual}</span>
                      <span className="sold-label">Terjual</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="empty-list">Belum ada data produk</li>
              )}
            </ul>
          </div>

          <div className="alert-card">
            <div className="card-header">
              <h3>Stok Menipis</h3>
              <button className="view-all" onClick={() => navigate('/inventory')}>Lihat Semua</button>
            </div>
            <div className="alert-content">
              <div className="alert-icon-box">
                <AlertCircle size={24} color="#e74c3c" />
              </div>
              <div className="alert-text">
                {lowStockCount > 0 ? (
                  <>
                    <p>{lowStockCount} item dengan stok menipis.</p>
                    <span>Segera lakukan restok.</span>
                  </>
                ) : (
                  <>
                    <p>Semua stok dalam kondisi baik.</p>
                    <span>Tidak ada item dengan stok rendah.</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>© 2026 MiMatcha. Hak cipta dilindungi.</p>
        <span>Versi 1.0.0</span>
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
      <div className="stat-trend">
        <span className="trend-indicator positive">
          <TrendingUp size={12} />
        </span>
        <span className="trend-label">{trend}</span>
      </div>
    </div>
  </div>
);

export default Dashboard;
