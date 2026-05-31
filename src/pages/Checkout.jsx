import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Trash2, Plus, Minus, X, 
  ShieldCheck, RotateCcw, Headset, 
  CreditCard, Banknote, Smartphone, MoreHorizontal, Lock, QrCode, Building2, CheckCircle, Clock
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/service';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get cart data from location state or localStorage
  const cartData = location.state?.cart || JSON.parse(localStorage.getItem('checkout_cart') || '[]');
  const orderData = location.state?.orderData || JSON.parse(localStorage.getItem('checkout_order') || '{}');
  const preSelectedMethod = location.state?.paymentMethod || localStorage.getItem('selected_payment_method') || 'qris';
  
  const [items, setItems] = useState(cartData);
  const [paymentMethod, setPaymentMethod] = useState(preSelectedMethod);
  const [customerType, setCustomerType] = useState('walk-in');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, waiting_payment, paid, failed
  const [orderId, setOrderId] = useState(orderData.id || null);

  const subtotal = items.reduce((acc, item) => acc + (item.harga || item.price || 0) * item.qty, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const updateQty = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id || item.id_produk === id) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id && item.id_produk !== id));
  };

  // Poll payment status
  useEffect(() => {
    if (paymentStatus === 'waiting_payment' && paymentData?.payment_reference) {
      const interval = setInterval(async () => {
        try {
          const result = await api.checkPaymentStatus(paymentData.payment_reference);
          if (result.success && result.payment) {
            if (result.payment.status === 'paid') {
              setPaymentStatus('paid');
              clearInterval(interval);
              setTimeout(() => {
                navigate('/orders');
              }, 3000);
            } else if (result.payment.status === 'expired' || result.payment.status === 'failed') {
              setPaymentStatus('failed');
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [paymentStatus, paymentData, navigate]);

  // Auto-trigger payment creation when component mounts with order data
  useEffect(() => {
    if (orderId && paymentMethod && paymentStatus === 'idle' && items.length > 0) {
      // Auto-create payment after a short delay
      const timer = setTimeout(() => {
        handlePlaceOrder();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [orderId, paymentMethod]);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      alert('Keranjang kosong!');
      return;
    }

    setPaymentStatus('processing');

    try {
      // Create payment
      const paymentPayload = {
        id_pesanan: orderId,
        amount: total,
        payment_method: paymentMethod,
        customer_name: customerName || 'Walk-in Customer',
        customer_email: customerEmail,
        customer_phone: customerPhone
      };

      const paymentResult = await api.createPayment(paymentPayload);

      if (paymentResult.success) {
        setPaymentData(paymentResult);
        setPaymentStatus('waiting_payment');
        
        // Clear cart from localStorage
        localStorage.removeItem('checkout_cart');
        localStorage.removeItem('checkout_order');
        localStorage.removeItem('selected_payment_method');
      } else {
        alert('Gagal membuat pembayaran: ' + (paymentResult.error || 'Unknown error'));
        setPaymentStatus('idle');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Terjadi kesalahan saat membuat pembayaran');
      setPaymentStatus('idle');
    }
  };

  return (
    <div className="checkout-theme">
      <div className="checkout-container">
        {paymentStatus === 'waiting_payment' && paymentData ? (
          // Payment Display Screen
          <div className="payment-display-screen">
            <div className="payment-card-large">
              <div className="payment-header">
                <h2>Menunggu Pembayaran</h2>
                <p>Silakan selesaikan pembayaran Anda</p>
              </div>

              {paymentMethod === 'qris' && (
                <div className="qris-display">
                  <div className="qris-icon"><QrCode size={48} /></div>
                  <h3>Scan QRIS Code</h3>
                  <div className="qr-code-container">
                    <img src={paymentData.qr_code_url} alt="QRIS Code" className="qr-code-image" />
                  </div>
                  <p className="qr-instruction">Scan kode QR di atas menggunakan aplikasi e-wallet Anda</p>
                  <div className="supported-wallets">
                    <span>GoPay</span>
                    <span>OVO</span>
                    <span>Dana</span>
                    <span>ShopeePay</span>
                    <span>LinkAja</span>
                  </div>
                </div>
              )}

              {paymentMethod.startsWith('va_') && (
                <div className="va-display">
                  <div className="va-icon"><Building2 size={48} /></div>
                  <h3>Virtual Account {paymentData.va_bank}</h3>
                  <div className="va-number-container">
                    <label>Nomor Virtual Account</label>
                    <div className="va-number">{paymentData.va_number}</div>
                    <button className="copy-btn" onClick={() => {
                      navigator.clipboard.writeText(paymentData.va_number);
                      alert('Nomor VA disalin!');
                    }}>Salin Nomor</button>
                  </div>
                  <div className="va-instructions">
                    <h4>Cara Pembayaran:</h4>
                    <ol>
                      <li>Buka aplikasi mobile banking atau ATM {paymentData.va_bank}</li>
                      <li>Pilih menu Transfer / Bayar</li>
                      <li>Masukkan nomor Virtual Account di atas</li>
                      <li>Masukkan nominal: <strong>{formatRupiah(paymentData.amount)}</strong></li>
                      <li>Konfirmasi pembayaran</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="payment-info-box">
                <div className="info-row">
                  <span>Total Pembayaran</span>
                  <strong>{formatRupiah(paymentData.amount)}</strong>
                </div>
                <div className="info-row">
                  <span>Referensi Pembayaran</span>
                  <strong>{paymentData.payment_reference}</strong>
                </div>
                <div className="info-row">
                  <span>Berlaku Hingga</span>
                  <strong>{new Date(paymentData.expired_at).toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="payment-status-indicator">
                <Clock className="spin-icon" size={24} />
                <span>Menunggu pembayaran...</span>
              </div>

              <button className="back-to-pos-btn" onClick={() => navigate('/pos')}>
                <ArrowLeft size={18} /> Kembali ke POS
              </button>
            </div>
          </div>
        ) : paymentStatus === 'paid' ? (
          // Payment Success Screen
          <div className="payment-success-screen">
            <div className="success-card">
              <CheckCircle size={80} className="success-icon" />
              <h2>Pembayaran Berhasil!</h2>
              <p>Terima kasih, pembayaran Anda telah diterima</p>
              <div className="success-amount">{formatRupiah(total)}</div>
              <button className="btn-primary" onClick={() => navigate('/orders')}>
                Lihat Pesanan
              </button>
            </div>
          </div>
        ) : (
          // Checkout Form
          <>
            <div className="checkout-left">
              <Link to="/pos" className="back-link">
                <ArrowLeft size={16} /> Kembali ke POS
              </Link>
              
              <header className="checkout-header">
                <h1 className="page-title">Checkout</h1>
                <p className="page-subtitle">Review keranjang dan selesaikan pembayaran</p>
              </header>

              <div className="checkout-card cart-items-card">
                <div className="card-header">
                  <h3>Keranjang ({items.length})</h3>
                  <button className="clear-btn" onClick={() => setItems([])}>
                    <Trash2 size={14} /> Kosongkan
                  </button>
                </div>
                
                <div className="checkout-items-list">
                  {items.map((item) => (
                    <div key={item.id || item.id_produk} className="checkout-item">
                      <div className="item-main">
                        <div className="item-img-placeholder">🍵</div>
                        <div className="item-info">
                          <h4 className="item-name">{item.name || item.nama_produk}</h4>
                          <span className="item-sku">SKU: {item.sku || item.id_produk}</span>
                          <div className="item-stock-status">
                            <span className="dot"></span> Tersedia
                          </div>
                        </div>
                      </div>
                      
                      <div className="item-controls">
                        <div className="qty-picker">
                          <button onClick={() => updateQty(item.id || item.id_produk, -1)}><Minus size={14}/></button>
                          <span>{item.qty}</span>
                          <button onClick={() => updateQty(item.id || item.id_produk, 1)}><Plus size={14}/></button>
                        </div>
                        <div className="item-price-info">
                          <div className="item-total-price">{formatRupiah((item.harga || item.price) * item.qty)}</div>
                          {item.qty > 1 && <div className="item-unit-price">{formatRupiah(item.harga || item.price)} each</div>}
                        </div>
                        <button className="item-remove-btn" onClick={() => removeItem(item.id || item.id_produk)}>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Link to="/pos" className="add-more-box">
                  <Plus size={18} /> Tambah Item
                </Link>
              </div>

              <div className="checkout-footer-info">
                <div className="info-box">
                  <ShieldCheck className="info-icon" />
                  <div className="info-text">
                    <strong>Pembayaran Aman</strong>
                    <span>Data Anda dilindungi dengan enkripsi tingkat bank</span>
                  </div>
                </div>
                <div className="info-box">
                  <RotateCcw className="info-icon" />
                  <div className="info-text">
                    <strong>Mudah Dikembalikan</strong>
                    <span>Kebijakan pengembalian 30 hari</span>
                  </div>
                </div>
                <div className="info-box">
                  <Headset className="info-icon" />
                  <div className="info-text">
                    <strong>Dukungan 24/7</strong>
                    <span>Kami siap membantu Anda kapan saja</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <div className="checkout-card order-summary-card">
                <div className="card-header">
                  <h3>Ringkasan Pesanan</h3>
                </div>
                <div className="summary-details">
                  <div className="summary-row"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                  <div className="summary-row"><span>Pajak (10%)</span><span>{formatRupiah(tax)}</span></div>
                  <div className="summary-total-large">
                    <span>Total</span>
                    <span className="total-value">{formatRupiah(total)}</span>
                  </div>
                </div>
              </div>

              <div className="checkout-card customer-card-premium">
                <div className="card-header">
                  <h3><UserIcon size={18}/> Informasi Pelanggan</h3>
                </div>
                <div className="customer-type-toggle">
                  <label className={`type-option ${customerType === 'walk-in' ? 'active' : ''}`}>
                    <input type="radio" checked={customerType === 'walk-in'} onChange={() => setCustomerType('walk-in')} />
                    <span>Walk-in</span>
                  </label>
                  <label className={`type-option ${customerType === 'existing' ? 'active' : ''}`}>
                    <input type="radio" checked={customerType === 'existing'} onChange={() => setCustomerType('existing')} />
                    <span>Pelanggan Terdaftar</span>
                  </label>
                </div>
                <div className="customer-form">
                  <div className="form-field">
                    <label>Nama Lengkap *</label>
                    <input type="text" placeholder="Masukkan nama pelanggan" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input type="email" placeholder="email@example.com (opsional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Nomor Telepon</label>
                    <input type="tel" placeholder="08xx xxxx xxxx (opsional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="checkout-card payment-card-premium">
                <div className="card-header">
                  <h3><CreditCard size={18}/> Metode Pembayaran</h3>
                </div>
                <div className="payment-options-grid">
                  <PaymentOption 
                    id="qris" 
                    label="QRIS" 
                    icon={<QrCode size={20}/>} 
                    active={paymentMethod === 'qris'} 
                    onClick={() => setPaymentMethod('qris')} 
                  />
                  <PaymentOption 
                    id="va_bca" 
                    label="VA BCA" 
                    icon={<Building2 size={20}/>} 
                    active={paymentMethod === 'va_bca'} 
                    onClick={() => setPaymentMethod('va_bca')} 
                  />
                  <PaymentOption 
                    id="va_bni" 
                    label="VA BNI" 
                    icon={<Building2 size={20}/>} 
                    active={paymentMethod === 'va_bni'} 
                    onClick={() => setPaymentMethod('va_bni')} 
                  />
                  <PaymentOption 
                    id="va_mandiri" 
                    label="VA Mandiri" 
                    icon={<Building2 size={20}/>} 
                    active={paymentMethod === 'va_mandiri'} 
                    onClick={() => setPaymentMethod('va_mandiri')} 
                  />
                </div>
              </div>

              <button 
                className="place-order-btn" 
                onClick={handlePlaceOrder}
                disabled={paymentStatus === 'processing' || items.length === 0}
              >
                <Lock size={18} /> 
                {paymentStatus === 'processing' ? 'Memproses...' : 'Bayar Sekarang'} 
                <span className="total-btn-val">{formatRupiah(total)}</span>
              </button>
              <p className="security-note">
                <ShieldCheck size={14} /> Transaksi Anda aman dan terenkripsi
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentOption = ({ id, label, icon, active, onClick }) => (
  <div className={`payment-option ${active ? 'active' : ''}`} onClick={onClick}>
    <div className="radio-circle"></div>
    {icon}
    <span>{label}</span>
  </div>
);

const UserIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default Checkout;
