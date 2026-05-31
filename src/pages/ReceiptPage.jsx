import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Receipt from '../components/Receipt';
import api from '../api/service';
import './ReceiptPage.css';

const ReceiptPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  useEffect(() => {
    // Auto-print after data loaded
    if (orderData && !loading) {
      // Delay to ensure rendering is complete
      const timer = setTimeout(() => {
        window.print();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [orderData, loading]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      
      // Get order details
      const orderResult = await api.getOrderDetails(orderId);
      
      if (!orderResult || orderResult.length === 0) {
        setError('Order tidak ditemukan');
        setLoading(false);
        return;
      }

      // Get order header
      const ordersResult = await api.getOrders();
      const order = ordersResult.find(o => o.id_pesanan == orderId);
      
      if (!order) {
        setError('Order tidak ditemukan');
        setLoading(false);
        return;
      }

      // Combine order header with items
      const fullOrderData = {
        id_pesanan: order.id_pesanan,
        tanggal_pesanan: order.tanggal_pesanan,
        total_pembayaran: order.total_pembayaran,
        metode_pembayaran: order.metode_pembayaran,
        kasir: order.kasir,
        status_pesanan: order.status_pesanan,
        items: orderResult
      };

      setOrderData(fullOrderData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Gagal memuat data order');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    navigate('/pos');
  };

  if (loading) {
    return (
      <div className="receipt-page-loading">
        <div className="loading-spinner"></div>
        <p>Memuat struk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipt-page-error">
        <div className="error-icon">⚠️</div>
        <h2>{error}</h2>
        <button onClick={handleClose} className="btn-back">Kembali ke POS</button>
      </div>
    );
  }

  return (
    <div className="receipt-page">
      {/* Action buttons - hidden when printing */}
      <div className="receipt-actions no-print">
        <button onClick={handlePrint} className="btn-print">
          🖨️ Print Ulang
        </button>
        <button onClick={handleClose} className="btn-close">
          ✕ Tutup
        </button>
      </div>

      {/* Receipt component */}
      <Receipt orderData={orderData} />

      {/* Back to POS button - hidden when printing */}
      <div className="receipt-footer-actions no-print">
        <button onClick={handleClose} className="btn-back-pos">
          ← Kembali ke POS
        </button>
      </div>
    </div>
  );
};

export default ReceiptPage;
