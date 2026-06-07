import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, Calendar, 
  ArrowUpRight, Download, RefreshCw, Printer,
  BarChart3, Inbox
} from 'lucide-react';
import api from '../api/service';

const COLORS = ['#4c632d', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [chartType, setChartType] = useState('bar');
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, dashboardRes] = await Promise.all([
        api.getAnalytics(period),
        api.getDashboardStats()
      ]);

      if (analyticsRes.penjualan) {
        setSalesData(analyticsRes.penjualan.map(item => ({
          name: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          sales: parseInt(item.total) || 0,
          orders: item.jumlah || 0
        })));
      }

      if (analyticsRes.kategori) {
        const totalKategori = analyticsRes.kategori.reduce((sum, item) => sum + parseInt(item.total || 0), 0);
        setCategoryData(analyticsRes.kategori.map((item, idx) => ({
          name: item.kategori || 'Lainnya',
          value: totalKategori > 0 ? parseFloat(((parseInt(item.total) / totalKategori) * 100).toFixed(1)) : 0,
          total: parseInt(item.total) || 0,
          color: COLORS[idx % COLORS.length]
        })));
      }

      if (dashboardRes.produk_terlaris) {
        const totalSold = dashboardRes.produk_terlaris.reduce((sum, p) => sum + parseInt(p.total_terjual || 0), 0);
        setTopProducts(dashboardRes.produk_terlaris.map(p => ({
          id: p.nama_produk,
          name: p.nama_produk,
          cat: p.nama_produk,
          sold: parseInt(p.total_terjual) || 0,
          revenue: `Rp ${parseInt(p.total_pendapatan || 0).toLocaleString('id-ID')}`,
          pct: totalSold > 0 ? parseFloat(((parseInt(p.total_terjual) / totalSold) * 100).toFixed(1)) : 0
        })));
      }

      const totalRevenue = parseInt(dashboardRes.pendapatan_bulan) || 0;
      const totalOrders = analyticsRes.penjualan ? analyticsRes.penjualan.reduce((sum, p) => sum + (p.jumlah || 0), 0) : 0;
      
      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Total Sales', 'Order Count'].join(','),
      ...salesData.map(item => [item.name, item.sales, item.orders].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getDateRange = () => {
    const today = new Date();
    let start;
    
    if (period === 'weekly') {
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      start = new Date(today.getFullYear(), 0, 1);
    }
    
    return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="analytics-page">
      <div className="sticky-header-wrapper">
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">Sales Report</h1>
            <p className="page-subtitle">Track your business performance and insights.</p>
          </div>
          <div className="header-right">
            <button className="export-btn" onClick={handleExport}>
              <Download size={18} /> Export CSV
            </button>
            <button className="print-btn" onClick={handlePrint} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              <Printer size={18} /> Print
            </button>
            <button className="refresh-btn" onClick={fetchAnalytics} style={{
               width: '40px',
               height: '40px',
               borderRadius: '10px',
               border: '1px solid #e2e8f0',
               background: 'white',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               cursor: 'pointer'
            }}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        <section className="filter-bar">
          <div className="date-display" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
            <Calendar size={18} />
            <span style={{ fontWeight: '600' }}>{getDateRange()}</span>
          </div>
          <div className="dropdown-filters">
            <div className="filter-select-wrapper">
              <select className="filter-select-native" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>
            <div className="filter-select-wrapper">
              <select className="filter-select-native">
                <option>All Outlets</option>
                <option>Main Store</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <p style={{ color: '#64748b' }}>Generating reports...</p>
        </div>
      ) : (
        <div className="analytics-scroll-content">
          <section className="analytics-kpis">
            <KPIItem icon={<TrendingUp size={24} />} label="Total Revenue" value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} color="green" />
            <KPIItem icon={<ShoppingBag size={24} />} label="Total Orders" value={stats.totalOrders} color="blue" />
            <KPIItem icon={<ArrowUpRight size={24} />} label="Avg. Order Value" value={`Rp ${stats.avgOrderValue.toLocaleString('id-ID')}`} color="purple" />
          </section>

          <section className="analytics-charts-grid">
            <div className="chart-card-full">
              <div className="card-header">
                <h3>Revenue Growth</h3>
                <div className="chart-type-toggle">
                  <button className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')}>Bar</button>
                  <button className={chartType === 'line' ? 'active' : ''} onClick={() => setChartType('line')}>Line</button>
                </div>
              </div>
              <div className="chart-container-large">
                {salesData.length === 0 ? (
                  <div className="chart-empty-state">
                    <BarChart3 size={48} />
                    <p>Belum ada data penjualan untuk periode ini</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'bar' ? (
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `Rp ${v >= 1000000 ? (v/1000000).toFixed(1) + 'jt' : v >= 1000 ? (v/1000).toFixed(0) + 'rb' : v}`} />
                        <Tooltip
                          cursor={{fill: 'rgba(76, 99, 45, 0.05)'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                          formatter={(v) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Revenue']}
                          labelFormatter={(label) => `Tanggal: ${label}`}
                        />
                        <Bar dataKey="sales" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} maxBarSize={60} />
                      </BarChart>
                    ) : (
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `Rp ${v >= 1000000 ? (v/1000000).toFixed(1) + 'jt' : v >= 1000 ? (v/1000).toFixed(0) + 'rb' : v}`} />
                        <Tooltip
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                          formatter={(v) => [`Rp ${Number(v).toLocaleString('id-ID')}`, 'Revenue']}
                          labelFormatter={(label) => `Tanggal: ${label}`}
                        />
                        <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} dot={{fill: 'var(--primary)', strokeWidth: 2, r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card-full">
              <div className="card-header">
                <h3>Category Distribution</h3>
              </div>
              {categoryData.length === 0 ? (
                <div className="chart-empty-state">
                  <Inbox size={48} />
                  <p>Belum ada data kategori untuk periode ini</p>
                </div>
              ) : (
                <div className="pie-chart-wrapper">
                  <div className="pie-container">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                          {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v, name) => [`${v}%`, name]}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="pie-legend">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                        <span className="legend-name">{item.name}</span>
                        <span className="legend-value">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="top-selling-section">
            <div className="content-card-white">
              <div className="card-header">
                <h3>Top Performing Products</h3>
              </div>
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Units Sold</th>
                    <th>Revenue Generated</th>
                    <th>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.sold}</td>
                      <td style={{ fontWeight: '700' }}>{p.revenue}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', width: '35px' }}>{p.pct}%</span>
                          <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.pct}%`, height: '100%', background: 'var(--primary)' }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const KPIItem = ({ icon, label, value, color }) => (
  <div className="kpi-card-white" style={{ flex: 1, padding: '1.5rem', borderRadius: '20px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'green' ? '#f0fdf4' : color === 'blue' ? '#eff6ff' : '#faf5ff', color: color === 'green' ? '#16a34a' : color === 'blue' ? '#3b82f6' : '#a855f7' }}>
      {icon}
    </div>
    <div>
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{label}</span>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: '2px 0 0 0' }}>{value}</h2>
    </div>
  </div>
);

export default Analytics;
