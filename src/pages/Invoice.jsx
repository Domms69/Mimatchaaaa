import React from 'react';
import { 
  Calendar, User, Store, CreditCard, Mail, Phone, 
  MapPin, Globe, CheckCircle2, Printer, Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const invoiceData = {
  no: 'INV-2025-0518-0012',
  date: 'May 18, 2025',
  time: '10:24 AM',
  customer: {
    name: 'Emma Johnson',
    address: '123 Maple Street, San Francisco, CA 94107, USA',
    phone: '(555) 123-4567',
    email: 'emma.johnson@example.com'
  },
  cashier: 'Admin User',
  store: 'QuickPOS Main Store',
  items: [
    { id: 1, name: 'Wireless Bluetooth Headphones', sku: 'ELEC-1001', qty: 1, price: 79.99, discount: 0.00 },
    { id: 2, name: 'Stainless Steel Water Bottle', sku: 'HOME-2003', qty: 2, price: 19.99, discount: 0.00 },
    { id: 3, name: 'Cotton T-Shirt (Medium)', sku: 'CLTH-3002-M', qty: 1, price: 24.99, discount: 5.00 },
    { id: 4, name: 'Yoga Mat', sku: 'SPORT-4001', qty: 1, price: 29.99, discount: 0.00 },
  ],
  payment: {
    method: 'Visa **** 4242',
    transactionId: 'TXN-2025-0518-7789'
  }
};

const Invoice = () => {
  const subtotal = invoiceData.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalDiscount = invoiceData.items.reduce((acc, item) => acc + item.discount, 0);
  const tax = (subtotal - totalDiscount) * 0.0825;
  const grandTotal = subtotal - totalDiscount + tax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-layout no-print-layout">
      <Sidebar />
      
      <main className="dashboard-main invoice-page-bg">
        <header className="main-header no-print">
          <div className="header-left">
            <h1 className="page-title">Invoice Detail</h1>
            <p className="page-subtitle">View and print professional invoices for your customers.</p>
          </div>
          <div className="header-right">
            <button className="export-btn" onClick={handlePrint}>
              <Printer size={18} /> Print Invoice
            </button>
            <button className="add-product-btn">
              <Download size={18} /> Download PDF
            </button>
          </div>
        </header>

        <div className="invoice-paper" id="printable-invoice">
          <header className="invoice-top">
            <div className="invoice-logo-section">
              <div className="i-logo">
                <div className="i-logo-icon">抹</div>
                <div className="i-logo-text">
                  <h2>QuickPOS</h2>
                  <span>Smart POS. Seamless Sales.</span>
                </div>
              </div>
            </div>
            <div className="invoice-meta-section">
              <h1>INVOICE</h1>
              <div className="meta-grid">
                <div className="meta-label">Invoice No.</div>
                <div className="meta-val">{invoiceData.no}</div>
                <div className="meta-label">Date</div>
                <div className="meta-val">{invoiceData.date}</div>
              </div>
            </div>
          </header>

          <section className="invoice-billing">
            <div className="bill-to">
              <span className="section-label">BILL TO</span>
              <h3 className="cust-name">{invoiceData.customer.name}</h3>
              <p className="cust-addr">{invoiceData.customer.address}</p>
              <p className="cust-contact">{invoiceData.customer.phone}</p>
              <p className="cust-contact">{invoiceData.customer.email}</p>
            </div>
            <div className="order-info">
              <div className="info-row">
                <Calendar size={16} />
                <span className="info-label">Order Date</span>
                <span className="info-val">{invoiceData.date} {invoiceData.time}</span>
              </div>
              <div className="info-row">
                <User size={16} />
                <span className="info-label">Cashier</span>
                <span className="info-val">{invoiceData.cashier}</span>
              </div>
              <div className="info-row">
                <Store size={16} />
                <span className="info-label">Store</span>
                <span className="info-val">{invoiceData.store}</span>
              </div>
            </div>
          </section>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>QTY</th>
                <th>UNIT PRICE</th>
                <th>DISCOUNT</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td className="prod-name">{item.name}</td>
                  <td className="sku-val">{item.sku}</td>
                  <td>{item.qty}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${item.discount.toFixed(2)}</td>
                  <td className="row-total">${(item.price * item.qty - item.discount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="invoice-footer">
            <div className="footer-left">
              <div className="payment-method-box">
                <span className="section-label">PAYMENT METHOD</span>
                <div className="pm-details">
                  <CreditCard size={18} />
                  <span>{invoiceData.payment.method}</span>
                </div>
                <span className="tx-id">Transaction ID: {invoiceData.payment.transactionId}</span>
              </div>
            </div>
            <div className="footer-right">
              <div className="totals-grid">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Discount</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="grand-total-row">
                  <span>GRAND TOTAL</span>
                  <span className="grand-val">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </footer>

          <div className="thanks-section">
            <div className="thanks-msg">
              <CheckCircle2 size={20} />
              <span>Thank you for your purchase!</span>
            </div>
            <p className="appreciation">We appreciate your business and look forward to serving you again.</p>
          </div>

          <div className="invoice-contact-bar">
            <div className="c-bar-item"><MapPin size={14}/> 123 Business Ave, San Francisco, CA 94107, USA</div>
            <div className="c-bar-item"><Phone size={14}/> (555) 987-6543</div>
            <div className="c-bar-item"><Mail size={14}/> support@quickpos.com</div>
            <div className="c-bar-item"><Globe size={14}/> www.quickpos.com</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Invoice;
