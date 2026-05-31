import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Download, Filter, MoreHorizontal, Eye, Printer, 
  ChevronDown, ChevronLeft, ChevronRight, Calendar,
  CheckCircle2, Clock, XCircle, AlertCircle, CreditCard, QrCode, Building2,
  Trash2, RefreshCw
} from 'lucide-react';
import api from '../api/service';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPayment, setFilterPayment] = useState('All Payment');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await api.getOrders();
      if (result && Array.isArray(result)) {
        setOrders(result);
      } else {
        setOrders([]);
        console.error('API Error:', result);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleExport = () => {
    const csv = [
      ['Order ID', 'Customer', 'Date', 'Status', 'Payment Method', 'Total'].join(','),
      ...filteredOrders.map(order => [
        `#${order.id_pesanan}`,
        `"${order.nama_pelanggan || 'Guest'}"`,
        `"${formatDate(order.tanggal_pesanan)}"`,
        order.status_pesanan,
        order.metode_pembayaran,
        order.total_pembayaran
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Receipt #${order.id_pesanan}</title></head>
        <body style="font-family: monospace; padding: 20px; width: 300px;">
          <h2 style="text-align:center">MIMATCHA POS</h2>
          <p style="text-align:center">Receipt: #${order.id_pesanan}</p>
          <hr/>
          <p>Date: ${formatDate(order.tanggal_pesanan)}</p>
          <p>Customer: ${order.nama_pelanggan || 'Guest'}</p>
          <hr/>
          <p style="display:flex; justify-content:space-between"><span>TOTAL</span> <span>${formatRupiah(order.total_pembayaran)}</span></p>
          <p style="text-align:center">Status: ${order.status_pesanan.toUpperCase()}</p>
          <hr/>
          <p style="text-align:center">Terima Kasih!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id_pesanan.toString().includes(searchTerm) || 
                         (order.nama_pelanggan && order.nama_pelanggan.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All Status' || order.status_pesanan === filterStatus.toLowerCase();
    
    let matchesPayment = true;
    if (filterPayment !== 'All Payment') {
      if (filterPayment === 'Cash') matchesPayment = order.metode_pembayaran === 'cash';
      if (filterPayment === 'QRIS') matchesPayment = order.metode_pembayaran === 'qris';
      if (filterPayment === 'VA') matchesPayment = order.metode_pembayaran.startsWith('va_');
    }
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <>
      <header className="main-header">
        <div className="header-left">
          <h1 className="page-title">Pesanan</h1>
          <p className="page-subtitle">Kelola dan lacak semua pesanan dan transaksi pelanggan.</p>
        </div>
        <div className="header-right">
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} /> Export Laporan
          </button>
          <button className="export-btn" onClick={loadOrders} style={{ background: '#f8f9fa', color: '#444' }}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </header>

      <section className="filter-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan ID Pesanan atau Pelanggan..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="dropdown-filters">
          <div className="filter-select-wrapper" style={{ position: 'relative' }}>
            <div className="filter-select" onClick={() => setShowStatusDropdown(!showStatusDropdown)}>
              <Filter size={16} />
              <span>{filterStatus === 'All Status' ? 'Semua Status' : filterStatus}</span>
              <ChevronDown size={14} />
            </div>
            {showStatusDropdown && (
              <div className="dropdown-menu" style={{ top: '100%', left: 0 }}>
                {['All Status', 'Lunas', 'Pending', 'Batal'].map(s => (
                  <div key={s} className="dropdown-item" onClick={() => { setFilterStatus(s); setShowStatusDropdown(false); setCurrentPage(1); }}>{s}</div>
                ))}
              </div>
            )}
          </div>

          <div className="filter-select-wrapper" style={{ position: 'relative' }}>
            <div className="filter-select" onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}>
              <CreditCard size={16} />
              <span>{filterPayment === 'All Payment' ? 'Semua Pembayaran' : filterPayment}</span>
              <ChevronDown size={14} />
            </div>
            {showPaymentDropdown && (
              <div className="dropdown-menu" style={{ top: '100%', left: 0 }}>
                {['All Payment', 'Cash', 'QRIS', 'VA'].map(p => (
                  <div key={p} className="dropdown-item" onClick={() => { setFilterPayment(p); setShowPaymentDropdown(false); setCurrentPage(1); }}>{p}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="orders-table-card">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID Pesanan</th>
              <th>Pelanggan</th>
              <th>Tanggal & Waktu</th>
              <th>Status</th>
              <th>Metode</th>
              <th>Status Bayar</th>
              <th>Total</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  Tidak ada pesanan ditemukan
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order.id_pesanan}>
                  <td className="order-id-cell">#{order.id_pesanan}</td>
                  <td className="customer-cell">
                    <div className="cust-info">
                      <div className="cust-avatar">{order.nama_pelanggan ? order.nama_pelanggan.charAt(0) : 'G'}</div>
                      <span>{order.nama_pelanggan || 'Guest'}</span>
                    </div>
                  </td>
                  <td className="date-cell">{formatDate(order.tanggal_pesanan)}</td>
                  <td>
                    <StatusBadge status={order.status_pesanan} />
                  </td>
                  <td>
                    <PaymentMethodBadge method={order.metode_pembayaran} />
                  </td>
                  <td>
                    <PaymentStatusBadge paymentRef={order.payment_reference} />
                  </td>
                  <td className="amount-cell">{formatRupiah(order.total_pembayaran)}</td>
                  <td>
                    <div className="action-group">
                      <button className="icon-action-btn" title="Lihat Detail" onClick={() => alert(`Detail Order #${order.id_pesanan}`)}><Eye size={16}/></button>
                      <button className="icon-action-btn" title="Print Struk" onClick={() => handlePrint(order)}><Printer size={16}/></button>
                      <button className="icon-action-btn"><MoreHorizontal size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <footer className="pagination-footer">
          <span className="showing-text">Menampilkan {currentOrders.length} dari {filteredOrders.length} pesanan</span>
          <div className="pagination">
            <button 
              className="page-nav" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={18}/>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              className="page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight size={18}/>
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    lunas: { icon: <CheckCircle2 size={14}/>, class: 'completed', label: 'Lunas' },
    pending: { icon: <Clock size={14}/>, class: 'pending', label: 'Pending' },
    batal: { icon: <XCircle size={14}/>, class: 'cancelled', label: 'Batal' },
  };
  
  const { icon, class: className, label } = config[status] || config.pending;
  
  return (
    <span className={`m-status-badge ${className}`}>
      {icon} {label}
    </span>
  );
};

const PaymentMethodBadge = ({ method }) => {
  const getMethodInfo = (m) => {
    if (!m || m === 'pending') return { icon: <Clock size={14}/>, label: 'Pending', color: '#f39c12' };
    if (m === 'qris') return { icon: <QrCode size={14}/>, label: 'QRIS', color: '#e74c3c' };
    if (m.startsWith('va_')) return { icon: <Building2 size={14}/>, label: 'VA ' + m.replace('va_', '').toUpperCase(), color: '#3498db' };
    if (m === 'cash') return { icon: <CreditCard size={14}/>, label: 'Cash', color: '#27ae60' };
    return { icon: <CreditCard size={14}/>, label: m, color: '#95a5a6' };
  };
  
  const { icon, label, color } = getMethodInfo(method);
  
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      padding: '4px 8px', 
      borderRadius: '6px', 
      background: `${color}20`,
      color: color,
      fontSize: '12px',
      fontWeight: '500'
    }}>
      {icon} {label}
    </span>
  );
};

const PaymentStatusBadge = ({ paymentRef }) => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentRef) {
      checkPaymentStatus();
    }
  }, [paymentRef]);

  const checkPaymentStatus = async () => {
    if (!paymentRef) return;
    setLoading(true);
    try {
      const result = await api.checkPaymentStatus(paymentRef);
      if (result.success && result.payment) {
        setPaymentStatus(result.payment.status);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!paymentRef) return <span style={{ fontSize: '12px', color: '#95a5a6' }}>-</span>;
  if (loading) return <span style={{ fontSize: '12px', color: '#95a5a6' }}>Loading...</span>;

  const statusConfig = {
    paid: { icon: <CheckCircle2 size={12}/>, label: 'Dibayar', color: '#27ae60' },
    pending: { icon: <Clock size={12}/>, label: 'Menunggu', color: '#f39c12' },
    expired: { icon: <XCircle size={12}/>, label: 'Kadaluarsa', color: '#e74c3c' },
    failed: { icon: <XCircle size={12}/>, label: 'Gagal', color: '#e74c3c' },
    cancelled: { icon: <XCircle size={12}/>, label: 'Dibatalkan', color: '#95a5a6' },
  };

  const { icon, label, color } = statusConfig[paymentStatus] || statusConfig.pending;

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      padding: '4px 8px', 
      borderRadius: '6px', 
      background: `${color}20`,
      color: color,
      fontSize: '12px',
      fontWeight: '500'
    }}>
      {icon} {label}
    </span>
  );
};

export default Orders;
