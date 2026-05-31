import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, User, Plus, Minus, X, 
  ChevronDown, Grid, List, ChevronLeft, ChevronRight,
  ShoppingCart, Trash2, Edit2, Pause, FileText, CreditCard,
  ShoppingBag, AlertCircle, Activity
} from 'lucide-react';
import api from '../api/service';
import ReceiptModal from '../components/ReceiptModal';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('Popular');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPOSData();

    // Re-fetch products whenever Products page adds/edits/deletes a product
    const handleProductsUpdated = () => {
      loadProductsOnly();
    };
    window.addEventListener('productsUpdated', handleProductsUpdated);

    // Also re-fetch when user navigates back to this tab (e.g. from Products page in same tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastUpdated = localStorage.getItem('products_last_updated');
        const lastFetched = localStorage.getItem('pos_products_last_fetched');
        if (!lastFetched || (lastUpdated && parseInt(lastUpdated) > parseInt(lastFetched))) {
          loadProductsOnly();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Re-fetch on window focus (when switching between browser windows/tabs)
    const handleWindowFocus = () => {
      const lastUpdated = localStorage.getItem('products_last_updated');
      const lastFetched = localStorage.getItem('pos_products_last_fetched');
      if (!lastFetched || (lastUpdated && parseInt(lastUpdated) > parseInt(lastFetched))) {
        loadProductsOnly();
      }
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const DEFAULT_PAYMENT_METHODS = [
    { id: 'qris', name: 'QRIS', type: 'qris' },
    { id: 'cash', name: 'CASH', type: 'cash' },
    { id: 'va_bca', name: 'VA BCA', type: 'va', bank: 'BCA' },
    { id: 'va_bni', name: 'VA BNI', type: 'va', bank: 'BNI' },
    { id: 'va_mandiri', name: 'VA Mandiri', type: 'va', bank: 'Mandiri' },
  ];

  // Lightweight refresh: only reload products & categories (no full reload)
  const loadProductsOnly = async () => {
    try {
      const productsResult = await api.getProducts();
      if (productsResult && Array.isArray(productsResult)) {
        setProducts(productsResult);
        const cats = [...new Set(productsResult.map(p => p.kategori || 'Uncategorized'))];
        setCategories(['All', ...cats]);
        localStorage.setItem('pos_products_last_fetched', Date.now().toString());
      }
    } catch (error) {
      console.error('Error refreshing POS products:', error);
    }
  };

  const loadPOSData = async () => {
    try {
      const [productsResult, statsResult, inventoryResult, paymentMethodsResult] = await Promise.all([
        api.getProducts(),
        api.getDashboardStats(),
        api.getInventory(),
        api.getPaymentMethods()
      ]);
      
      if (productsResult && Array.isArray(productsResult)) {
        setProducts(productsResult);
        const cats = [...new Set(productsResult.map(p => p.kategori || 'Uncategorized'))];
        setCategories(['All', ...cats]);
        localStorage.setItem('pos_products_last_fetched', Date.now().toString());
      } else {
        setProducts([]);
        setCategories(['All']);
      }

      // Auto-detect payment methods from API; fall back to defaults if none configured
      if (paymentMethodsResult && paymentMethodsResult.success && Array.isArray(paymentMethodsResult.methods) && paymentMethodsResult.methods.length > 0) {
        setPaymentMethods(paymentMethodsResult.methods);
      } else {
        // Use built-in defaults so POS always has usable payment options
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      }

      // Load Notifications (Same as Dashboard for consistency)
      const newNotifications = [];
      if (statsResult && Array.isArray(statsResult.pesanan_terbaru)) {
        statsResult.pesanan_terbaru.slice(0, 3).forEach(order => {
          newNotifications.push({
            id: `order-${order.id_pesanan}`,
            text: `New order #${order.id_pesanan} received`,
            time: 'Recently',
            icon: <ShoppingBag size={14}/>,
            type: 'order',
            link: '/orders'
          });
        });
      }
      if (inventoryResult && Array.isArray(inventoryResult)) {
        const lowStockItems = inventoryResult.filter(item => item.stok > 0 && item.stok <= 10);
        if (lowStockItems.length > 0) {
          newNotifications.push({
            id: 'low-stock-alert',
            text: `${lowStockItems.length} items low on stock`,
            time: 'Check Now',
            icon: <AlertCircle size={14}/>,
            type: 'alert',
            link: '/inventory'
          });
        }
      }
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);

    } catch (error) {
      console.error('Error loading POS data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logic for filtering, sorting and pagination
  const processedProducts = products
    .filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.kategori === selectedCategory;
      const matchesSearch = p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && p.stok > 0;
    })
    .sort((a, b) => {
      if (sortBy === 'Name (A-Z)') return a.nama_produk.localeCompare(b.nama_produk);
      if (sortBy === 'Name (Z-A)') return b.nama_produk.localeCompare(a.nama_produk);
      if (sortBy === 'Price: Low to High') return a.harga - b.harga;
      if (sortBy === 'Price: High to Low') return b.harga - a.harga;
      return 0; // Popular (default)
    });

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const currentProducts = processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const subtotal = cart.reduce((acc, item) => acc + (item.harga * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const addToCart = (product) => {
    const existing = cart.find(item => item.id_produk === product.id_produk);
    if (existing) {
      setCart(cart.map(item => item.id_produk === product.id_produk ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id_produk === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id_produk !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleMarkAllAsRead = () => {
    setUnreadCount(0);
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    navigate(link);
  };

  const handlePaymentMethodSelect = async (paymentMethod) => {
    setShowPaymentModal(false);
    
    if (paymentMethod === 'cash') {
      setShowCashModal(true);
      return;
    }
    
    setCurrentPaymentMethod(paymentMethod);
    
    const orderData = {
      id_pelanggan: null,
      total: total,
      status: 'pending',
      metode_pembayaran: paymentMethod,
      kasir: localStorage.getItem('mimatcha_user') ? JSON.parse(localStorage.getItem('mimatcha_user')).name : 'Kasir',
      items: cart.map(item => ({
        id_produk: item.id_produk,
        jumlah: item.qty,
        harga: item.harga,
        subtotal: item.harga * item.qty
      }))
    };

    try {
      const orderResult = await api.createOrder(orderData);
      if (!orderResult.success) {
        alert('Gagal menyimpan pesanan: ' + orderResult.error);
        return;
      }

      // Store order ID for later use
      const orderId = orderResult.id;

      const paymentPayload = {
        id_pesanan: orderId,
        amount: total,
        payment_method: paymentMethod,
        customer_name: 'Walk-in Customer',
        customer_email: '',
        customer_phone: ''
      };

      const paymentResult = await api.createPayment(paymentPayload);
      
      if (paymentResult.success) {
        setPaymentData({ ...paymentResult, orderId: orderId });
        setShowPaymentDetailsModal(true);
      } else {
        alert('Gagal membuat pembayaran: ' + (paymentResult.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat memproses pembayaran');
    }
  };

  const handleCashPayment = async (received, change) => {
    setShowCashModal(false);
    
    const orderData = {
      id_pelanggan: null,
      total: total,
      status: 'lunas',
      metode_pembayaran: 'cash',
      kasir: localStorage.getItem('mimatcha_user') ? JSON.parse(localStorage.getItem('mimatcha_user')).name : 'Kasir',
      items: cart.map(item => ({
        id_produk: item.id_produk,
        jumlah: item.qty,
        harga: item.harga,
        subtotal: item.harga * item.qty
      }))
    };

    try {
      const result = await api.createOrder(orderData);
      if (result.success) {
        // Prepare receipt data
        const receipt = {
          id_pesanan: result.id,
          tanggal_pesanan: new Date(),
          total_pembayaran: total,
          metode_pembayaran: 'cash',
          kasir: orderData.kasir,
          uang_diterima: received,
          kembalian: change,
          items: cart.map(item => ({
            nama_produk: item.nama_produk,
            jumlah: item.qty,
            harga: item.harga,
            subtotal: item.harga * item.qty
          }))
        };
        
        // Clear cart
        setCart([]);
        
        // Show receipt modal
        setReceiptData(receipt);
        setShowReceiptModal(true);
      } else {
        alert('Gagal menyimpan pesanan: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan pesanan');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="pos-theme">
      <main className="pos-main">
        <header className="pos-top-bar">
          <div className="pos-search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search products by name, SKU or barcode... (Ctrl + K)"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <span className="search-hint">Ctrl + K</span>
          </div>
          <div className="pos-top-actions">
            <div className="notification-wrapper" style={{ position: 'relative' }}>
              <button className="notif-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="dropdown-menu notification-dropdown" style={{ right: 0, top: '100%' }}>
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

        <div className="pos-content-grid">
          <section className="pos-catalog">
            <div className="catalog-header">
              <aside className="pos-cat-nav">
                <div className="cat-title">CATEGORIES</div>
                <ul className="cat-list">
                  {categories.map((cat, idx) => (
                    <li 
                      key={idx} 
                      className={selectedCategory === cat ? 'active' : ''}
                      onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                    >
                      <span>{cat}</span>
                      <span className="count">{cat === 'All' ? products.length : products.filter(p => p.kategori === cat).length}</span>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="product-view-area">
                <div className="view-header">
                  <h3>{selectedCategory} <span className="total-count">({processedProducts.length})</span></h3>
                  <div className="view-controls">
                    <div className="grid-toggle">
                      <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                        <Grid size={18}/>
                      </button>
                      <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                        <List size={18}/>
                      </button>
                    </div>
                    <div className="sort-dropdown-wrapper" style={{ position: 'relative' }}>
                      <div className="sort-dropdown" onClick={() => setShowSortDropdown(!showSortDropdown)}>
                        <span>Sort by: <strong>{sortBy}</strong></span>
                        <ChevronDown size={14} />
                      </div>
                      {showSortDropdown && (
                        <div className="dropdown-menu sort-options" style={{ top: '100%', right: 0 }}>
                          {['Popular', 'Name (A-Z)', 'Name (Z-A)', 'Price: Low to High', 'Price: High to Low'].map(opt => (
                            <div key={opt} className="dropdown-item" onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'pos-grid' : 'pos-list'}>
                  {currentProducts.map((p) => (
                    <div key={p.id_produk} className="pos-product-card">
                      <div className="p-img">
                        {p.gambar ? (
                          <img src={p.gambar} alt={p.nama_produk} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          '🍵'
                        )}
                      </div>
                      <div className="p-info">
                        <span className="p-name">{p.nama_produk}</span>
                        <span className="p-price">{formatRupiah(p.harga)}</span>
                        <div className="p-footer">
                          <span className={`p-stock ${p.stok < 10 ? 'low' : ''}`}>{p.stok} pcs</span>
                          <button className="add-to-cart" onClick={() => addToCart(p)}><Plus size={18}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="pos-pagination">
                  <button 
                    className="p-nav" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft size={16}/>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`p-num ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="p-nav"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    <ChevronRight size={16}/>
                  </button>
                </footer>
              </div>
            </div>
          </section>

          <aside className="pos-cart-sidebar">
            <div className="cart-header">
              <h3>Cart ({cart.length})</h3>
              <button className="clear-btn" onClick={() => setCart([])}><Trash2 size={14}/> Clear Cart</button>
            </div>

            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id_produk} className="cart-item">
                  <div className="item-img">
                    {item.gambar ? (
                      <img src={item.gambar} alt={item.nama_produk} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '🍵'
                    )}
                  </div>
                  <div className="item-details">
                    <div className="item-row">
                      <span className="item-name">{item.nama_produk}</span>
                      <button className="remove-item" onClick={() => removeFromCart(item.id_produk)}><X size={14}/></button>
                    </div>
                    <span className="item-price">{formatRupiah(item.harga)}</span>
                    <div className="item-actions">
                      <div className="qty-control">
                        <button onClick={() => updateQty(item.id_produk, -1)}><Minus size={14}/></button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id_produk, 1)}><Plus size={14}/></button>
                      </div>
                      <span className="item-total">{formatRupiah(item.harga * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="summary-row"><span>Tax (10%)</span><span>{formatRupiah(tax)}</span></div>
              <div className="summary-total"><span>Total</span><span>{formatRupiah(total)}</span></div>
            </div>

            <div className="receipt-preview">
              <div className="preview-header">Preview Struk</div>
              <div className="preview-row"><span>{cart.length} items</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="preview-row"><span>Tax (10%)</span><span>{formatRupiah(tax)}</span></div>
              <div className="divider-dash"></div>
              <div className="preview-total"><span>Total</span><span>{formatRupiah(total)}</span></div>
            </div>

            <div className="pos-actions">
              <button 
                className="checkout-btn" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleCheckout}
              >
                <CreditCard size={20}/> Bayar {formatRupiah(total)}
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pilih Metode Pembayaran</h3>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="payment-total-display">
                Total Pembayaran: <strong>{formatRupiah(total)}</strong>
              </div>
              <div className="payment-methods-grid">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <button 
                      key={method.id} 
                      className="payment-method-btn" 
                      onClick={() => handlePaymentMethodSelect(method.id)}
                    >
                      <div className="method-icon">
                        {method.type === 'qris' ? '📱' : method.type === 'va' ? '🏦' : '💵'}
                      </div>
                      <div className="method-name">{method.name}</div>
                      <div className="method-desc">
                        {method.type === 'qris' ? 'Semua E-Wallet' : 
                         method.type === 'va' ? `Virtual Account ${method.bank || ''}` : 
                         'Tunai'}
                      </div>
                    </button>
                  ))
                ) : (
                  <>
                    <button className="payment-method-btn" onClick={() => handlePaymentMethodSelect('qris')}>
                      <div className="method-icon">📱</div>
                      <div className="method-name">QRIS</div>
                      <div className="method-desc">Semua E-Wallet</div>
                    </button>
                    <button className="payment-method-btn" onClick={() => handlePaymentMethodSelect('cash')}>
                      <div className="method-icon">💵</div>
                      <div className="method-name">CASH</div>
                      <div className="method-desc">Tunai</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal (QRIS/VA) */}
      {showPaymentDetailsModal && paymentData && (
        <PaymentDetailsModal 
          show={showPaymentDetailsModal}
          onClose={() => {
            setShowPaymentDetailsModal(false);
            setPaymentData(null);
            setCart([]);
          }}
          paymentData={paymentData}
          paymentMethod={currentPaymentMethod}
          total={total}
          orderId={paymentData.orderId}
          onPaymentSuccess={(orderId) => {
            // Prepare receipt data
            const receipt = {
              id_pesanan: orderId,
              tanggal_pesanan: new Date(),
              total_pembayaran: total,
              metode_pembayaran: currentPaymentMethod,
              kasir: localStorage.getItem('mimatcha_user') ? JSON.parse(localStorage.getItem('mimatcha_user')).name : 'Kasir',
              items: cart.map(item => ({
                nama_produk: item.nama_produk,
                jumlah: item.qty,
                harga: item.harga,
                subtotal: item.harga * item.qty
              }))
            };
            
            setCart([]);
            setReceiptData(receipt);
            setShowReceiptModal(true);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <ReceiptModal
          show={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setReceiptData(null);
          }}
          orderData={receiptData}
        />
      )}

      {/* Cash Scanner Modal */}
      {showCashModal && (
        <CashScannerModal 
          show={showCashModal}
          onClose={() => setShowCashModal(false)}
          total={total}
          onComplete={handleCashPayment}
        />
      )}
    </div>
  );
};

const PaymentDetailsModal = ({ show, onClose, paymentData, paymentMethod, total, orderId, onPaymentSuccess }) => {
  const [status, setStatus] = useState('pending');
  const [polling, setPolling] = useState(true);
  
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  useEffect(() => {
    if (!polling) return;
    
    const interval = setInterval(async () => {
      try {
        const result = await api.checkPaymentStatus(paymentData.payment_reference);
        if (result.success && result.payment) {
          if (result.payment.status === 'paid') {
            setStatus('paid');
            setPolling(false);
            setTimeout(() => {
              onClose();
              // Redirect to receipt page after payment success
              if (onPaymentSuccess && orderId) {
                onPaymentSuccess(orderId);
              }
            }, 2000);
          } else if (result.payment.status === 'expired' || result.payment.status === 'failed') {
            setStatus('failed');
            setPolling(false);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, paymentData, onClose, onPaymentSuccess, orderId]);

  if (!show) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
        <div className="modal-header">
          <h3>
            {paymentMethod === 'qris' ? '📱 Pembayaran QRIS' : `🏦 Pembayaran VA ${paymentData.va_bank || ''}`}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" style={{ padding: '16px' }}>
          <div className="payment-info-box">
            <div className="info-row">
              <span>Total Pembayaran:</span>
              <strong>{formatRupiah(total)}</strong>
            </div>
            <div className="info-row">
              <span>Referensi:</span>
              <strong style={{ fontSize: '0.85rem' }}>{paymentData.payment_reference}</strong>
            </div>
          </div>

          {paymentMethod === 'qris' && paymentData.qr_code_url && (
            <div className="qris-display-container" style={{
              width: '100%',
              padding: '24px',
              border: '2px solid #4c632d',
              borderRadius: '12px',
              marginBottom: '16px',
              background: '#fff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                Scan QR Code untuk Bayar
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '800', 
                color: '#4c632d', 
                marginBottom: '16px',
                letterSpacing: '1px'
              }}>
                {formatRupiah(total)}
              </div>
              <img 
                src={paymentData.qr_code_url} 
                alt="QRIS Payment Code" 
                style={{ 
                  width: '280px', 
                  height: '280px', 
                  margin: '0 auto',
                  display: 'block',
                  border: '3px solid #4c632d',
                  borderRadius: '8px'
                }}
              />
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                Scan dengan aplikasi e-wallet: GoPay, OVO, Dana, ShopeePay, LinkAja
              </div>
            </div>
          )}

          {paymentMethod !== 'qris' && paymentData.payment_url && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <a 
                href={paymentData.payment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'block',
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}
              >
                🔗 Buka di Tab Baru
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(paymentData.payment_url);
                  alert('Link pembayaran disalin!');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 Salin Link
              </button>
            </div>
          )}

          <div className={`payment-status-box ${status}`}>
            {status === 'pending' && (
              <>
                <div className="status-icon">⏳</div>
                <div className="status-text">Menunggu pembayaran...</div>
              </>
            )}
            {status === 'paid' && (
              <>
                <div className="status-icon">✅</div>
                <div className="status-text">Pembayaran Berhasil!</div>
              </>
            )}
            {status === 'failed' && (
              <>
                <div className="status-icon">❌</div>
                <div className="status-text">Pembayaran Gagal</div>
              </>
            )}
          </div>

          <div className="payment-expiry">
            Berlaku hingga: {new Date(paymentData.expired_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </div>

          {status === 'pending' && (
            <button className="cancel-payment-btn" onClick={onClose}>
              Batalkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CashScannerModal = ({ show, onClose, total, onComplete }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [received, setReceived] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Arahkan uang ke kamera...');
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectedMoney, setDetectedMoney] = useState([]); 
  const [lastAnalysis, setLastAnalysis] = useState(null); 
  
  const change = received - total;
  
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  useEffect(() => {
    if (show) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [show]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraReady(true);
        setStatus('Kamera siap. Arahkan uang ke kamera dan klik Scan.');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('❌ Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const detectMoneyWithAI = async (imageData) => {
    try {
      const response = await fetch('http://localhost/testtt/api/detect_money.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('AI Detection error:', error);
      return { success: false, error: error.message };
    }
  };

  const captureAndDetect = async () => {
    if (!cameraReady || scanning) return;
    
    setScanning(true);
    setStatus('🔍 Menganalisis uang dengan AI...');
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const result = await detectMoneyWithAI(imageData);
      
      if (!result.success) {
        setStatus(`❌ Gagal analisis: ${result.error || result.last_error || 'Unknown error'}`);
        setScanning(false);
        return;
      }
      
      const analysis = result.analysis;
      setLastAnalysis(analysis);
      
      if (!analysis.is_money) {
        setStatus('❌ Tidak terdeteksi uang dalam gambar');
        setScanning(false);
        return;
      }
      
      if (!analysis.is_real) {
        setStatus(`❌ Uang PALSU terdeteksi! ${analysis.notes || ''}`);
        setScanning(false);
        return;
      }
      
      if (analysis.denomination > 0) {
        setReceived(prev => prev + analysis.denomination);
        setDetectedMoney(prev => [...prev, {
          denomination: analysis.denomination,
          confidence: analysis.confidence,
          timestamp: new Date().toLocaleTimeString('id-ID')
        }]);
        setStatus(`✅ Uang ${formatRupiah(analysis.denomination)} terdeteksi ASLI (Confidence: ${analysis.confidence}%)`);
      } else {
        setStatus('⚠️ Uang terdeteksi tapi nominal tidak jelas');
      }
      
    } catch (error) {
      console.error('Detection error:', error);
      setStatus('❌ Gagal mendeteksi uang: ' + error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleComplete = () => {
    if (received < total) {
      alert('Uang yang diterima kurang dari total pembayaran!');
      return;
    }
    stopCamera();
    onComplete(received, change);
  };
  
  if (!show) return null;
  
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal cash-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💵 Scan Uang Tunai</h3>
          <button className="close-btn" onClick={() => { stopCamera(); onClose(); }}>×</button>
        </div>
        <div className="modal-body">
          <div className="camera-container">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          
          <div className="cash-summary">
            <div className="cash-row">
              <span>Total Pembayaran:</span>
              <strong>{formatRupiah(total)}</strong>
            </div>
            <div className="cash-row">
              <span>Uang Diterima:</span>
              <strong style={{ color: '#27ae60' }}>{formatRupiah(received)}</strong>
            </div>
            <div className="cash-row">
              <span>Kembalian:</span>
              <strong style={{ color: change >= 0 ? '#27ae60' : '#e74c3c' }}>
                {formatRupiah(Math.max(0, change))}
              </strong>
            </div>
          </div>
          
          <div className="scan-status">
            {status}
          </div>
          
          <button 
            className="scan-money-btn"
            onClick={captureAndDetect}
            disabled={!cameraReady || scanning}
            style={{
              width: '100%',
              padding: '1rem',
              marginBottom: '1rem',
              background: cameraReady && !scanning ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: cameraReady && !scanning ? 'pointer' : 'not-allowed'
            }}
          >
            {scanning ? '🔍 Scanning...' : '📷 Scan Uang'}
          </button>
          
          <button 
            className="complete-cash-btn" 
            onClick={handleComplete}
            disabled={received < total}
            style={{
              width: '100%',
              padding: '1rem',
              background: received >= total ? '#27ae60' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: received >= total ? 'pointer' : 'not-allowed'
            }}
          >
            {received >= total ? '✅ Selesai & Print Struk' : '⏳ Menunggu Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
