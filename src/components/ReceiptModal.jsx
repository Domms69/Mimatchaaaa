import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './ReceiptModal.css';

const ReceiptModal = ({ show, onClose, orderData }) => {
  const receiptRef = useRef();

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

  const handlePrint = async () => {
    try {
      const receiptElement = receiptRef.current;
      
      // Generate canvas from HTML
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF (80mm width = ~226 pixels = ~80mm at 72dpi)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // 80mm width, A4 height
      });
      
      // Calculate dimensions
      const imgWidth = 80; // 80mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `Struk_${orderData.id_pesanan}_${timestamp}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Coba lagi.');
    }
  };

  if (!show || !orderData) return null;

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Receipt Content */}
        <div className="receipt-content" ref={receiptRef}>
          <div className="receipt-paper-modal">
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

        {/* Action Buttons */}
        <div className="receipt-modal-actions">
          <button className="btn-print-modal" onClick={handlePrint}>
            🖨️ Print Struk
          </button>
          <button className="btn-close-modal" onClick={onClose}>
            ✓ Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
