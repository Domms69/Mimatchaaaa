import React, { useState } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  BarChart3, Settings, LogOut, Menu, X, TrendingUp,
  DollarSign, ShoppingBag, UserPlus, ArrowUp, ArrowDown
} from 'lucide-react';
import './index.css';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Package, label: 'Produk', active: false },
  { icon: ShoppingCart, label: 'POS', active: false },
  { icon: Users, label: 'Pelanggan', active: false },
  { icon: BarChart3, label: 'Laporan', active: false },
  { icon: Settings, label: 'Pengaturan', active: false },
];

const recentOrders = [
  { id: '#ORD-001', customer: 'Budi Santoso', total: 'Rp 125.000', status: 'Selesai', time: '10 min ago' },
  { id: '#ORD-002', customer: 'Siti Aminah', total: 'Rp 89.000', status: 'Diproses', time: '25 min ago' },
  { id: '#ORD-003', customer: 'Ahmad Fauzi', total: 'Rp 210.000', status: 'Menunggu', time: '1 hour ago' },
  { id: '#ORD-004', customer: 'Dewi Lestari', total: 'Rp 65.000', status: 'Selesai', time: '2 hours ago' },
];

const topProducts = [
  { name: 'Beras Premium 5kg', sold: 45, revenue: 'Rp 4.500.000' },
  { name: 'Minyak Goreng 1L', sold: 38, revenue: 'Rp 1.140.000' },
  { name: 'Gula Pasir 1kg', sold: 32, revenue: 'Rp 480.000' },
];

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <div className="logo-icon">SP</div>
            <span className="brand-name">MIMATCHA</span>
          </div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item, index) => (
            <a 
              key={index} 
              href="#" 
              className={`menu-item ${item.active ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="menu-item logout">
            <LogOut size={20} />
            <span>Keluar</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="top-bar-title">
            <h1>Dashboard</h1>
            <p>Ringkasan bisnis hari ini</p>
          </div>
          <div className="top-bar-right">
            <div className="user-avatar">AD</div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Pendapatan</span>
              <h3 className="stat-value">Rp 12.450.000</h3>
              <span className="stat-change positive">
                <ArrowUp size={14} /> +12.5% dari bulan lalu
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Pesanan</span>
              <h3 className="stat-value">156</h3>
              <span className="stat-change positive">
                <ArrowUp size={14} /> +8.2% dari bulan lalu
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon customers">
              <UserPlus size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pelanggan Baru</span>
              <h3 className="stat-value">23</h3>
              <span className="stat-change negative">
                <ArrowDown size={14} /> -2.1% dari bulan lalu
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <Package size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Produk Terjual</span>
              <h3 className="stat-value">89</h3>
              <span className="stat-change positive">
                <ArrowUp size={14} /> +15.3% dari bulan lalu
              </span>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="content-grid">
          {/* Recent Orders */}
          <div className="content-card orders-card">
            <div className="card-header">
              <h2>Pesanan Terbaru</h2>
              <a href="#" className="view-all">Lihat Semua</a>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Pesanan</th>
                    <th>Pelanggan</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td className="order-total">{order.total}</td>
                      <td>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="order-time">{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="content-card products-card">
            <div className="card-header">
              <h2>Produk Terlaris</h2>
              <a href="#" className="view-all">Lihat Semua</a>
            </div>
            <div className="product-list">
              {topProducts.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-rank">{index + 1}</div>
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-sold">{product.sold} terjual</span>
                  </div>
                  <div className="product-revenue">{product.revenue}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chart Section */}
        <section className="chart-section">
          <div className="content-card chart-card">
            <div className="card-header">
              <h2>Grafik Penjualan</h2>
              <div className="chart-filter">
                <button className="filter-btn active">Minggu</button>
                <button className="filter-btn">Bulan</button>
                <button className="filter-btn">Tahun</button>
              </div>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {[65, 45, 80, 55, 90, 70, 85].map((height, index) => (
                  <div key={index} className="chart-bar" style={{ height: `${height}%` }}>
                    <span className="bar-value">{height}K</span>
                  </div>
                ))}
              </div>
              <div className="chart-labels">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
                <span>Min</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;