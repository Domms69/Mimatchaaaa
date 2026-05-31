import React from 'react';
import './Receipt.css';

const Receipt = ({ orderData }) => {
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(num);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!orderData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="receipt-container">
      <div className="receipt-paper">
        {/* Header */}
        <div className="receipt-header">
          <h1 className="receipt-title">MIMATCHA</h1>
          <p className="receipt-subtitle">Premium Matcha & Beverages</p>
          <div className="receipt-divider"></div>
        </div>

        {/* Order Info */}
        <div className="receipt-info">
          <div className="info-row">
            <span className="info-label">No. Order:</span>
            <span className="info-value">#{orderData.id_pesanan}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Tanggal:</span>
            <span className="info-value">{formatDate(orderData.tanggal_pesanan || new Date())}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Kasir:</span>
            <span className="info-value">{orderData.kasir || 'Kasir'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Pembayaran:</span>
            <span className="info-value">{orderData.metode_pembayaran?.toUpperCase() || 'CASH'}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Items */}
        <div className="receipt-items">
          <table className="items-table">
            <thead>
              <tr>
                <th className="item-name">Item</th>
                <th className="item-qty">Qty</th>
                <th className="item-price">Harga</th>
                <th className="item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items && orderData.items.map((item, index) => (
                <tr key={index}>
                  <td className="item-name">{item.nama_produk}</td>
                  <td className="item-qty">{item.jumlah_produk || item.jumlah}</td>
                  <td className="item-price">{formatRupiah(item.harga_satuan || item.harga)}</td>
                  <td className="item-total">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="receipt-divider"></div>

        {/* Total */}
        <div className="receipt-total">
          <div className="total-row">
            <span className="total-label">TOTAL:</span>
            <span className="total-value">{formatRupiah(orderData.total_pembayaran || orderData.total)}</span>
          </div>
          
          {orderData.metode_pembayaran === 'cash' && orderData.uang_diterima && (
            <>
              <div className="total-row">
                <span className="total-label">Diterima:</span>
                <span className="total-value">{formatRupiah(orderData.uang_diterima)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Kembalian:</span>
                <span className="total-value">{formatRupiah(orderData.kembalian)}</span>
              </div>
            </>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* Footer */}
        <div className="receipt-footer">
          <p className="thank-you">Terima Kasih</p>
          <p className="thank-you-sub">Atas Kunjungan Anda</p>
          <p className="contact-info">www.mimatcha.id | @mimatcha</p>
          <p className="contact-info">Telp: (021) 1234-5678</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
