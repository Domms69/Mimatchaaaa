import React, { useState } from 'react';
import { 
  Search, Plus, Download, MoreVertical, Edit3, Trash2, 
  ChevronDown, ChevronLeft, ChevronRight, User, 
  Star, Mail, Phone, Calendar, DollarSign
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const initialCustomers = [
  { id: 1, name: 'Emma Johnson', email: 'emma.j@example.com', phone: '+1 234 567 8901', spent: '$1,245.50', orders: 12, lastVisit: 'May 18, 2025', status: 'VIP' },
  { id: 2, name: 'Liam Smith', email: 'liam.s@example.com', phone: '+1 234 567 8902', spent: '$850.00', orders: 8, lastVisit: 'May 18, 2025', status: 'Regular' },
  { id: 3, name: 'Olivia Brown', email: 'olivia.b@example.com', phone: '+1 234 567 8903', spent: '$2,110.75', orders: 24, lastVisit: 'May 17, 2025', status: 'VIP' },
  { id: 4, name: 'Noah Wilson', email: 'noah.w@example.com', phone: '+1 234 567 8904', spent: '$45.00', orders: 1, lastVisit: 'May 15, 2025', status: 'New' },
  { id: 5, name: 'Ava Davis', email: 'ava.d@example.com', phone: '+1 234 567 8905', spent: '$540.00', orders: 5, lastVisit: 'May 12, 2025', status: 'Regular' },
  { id: 6, name: 'James Taylor', email: 'james.t@example.com', phone: '+1 234 567 8906', spent: '$1,875.40', orders: 15, lastVisit: 'May 10, 2025', status: 'VIP' },
  { id: 7, name: 'Sophia Martinez', email: 'sophia.m@example.com', phone: '+1 234 567 8907', spent: '$420.00', orders: 4, lastVisit: 'May 08, 2025', status: 'Regular' },
  { id: 8, name: 'William Anderson', email: 'william.a@example.com', phone: '+1 234 567 8908', spent: '$95.25', orders: 2, lastVisit: 'May 05, 2025', status: 'New' },
];

const Customers = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main">
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">Manage your customer database and loyalty programs.</p>
          </div>
          <div className="header-right">
            <button className="export-btn">
              <Download size={18} /> Export List
            </button>
            <button className="add-product-btn">
              <Plus size={18} /> New Customer
            </button>
          </div>
        </header>

        <section className="filter-bar">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search by name, email or phone..." />
          </div>
          <div className="dropdown-filters">
            <div className="filter-select">
              <span>All Status</span>
              <ChevronDown size={14} />
            </div>
            <div className="filter-select">
              <span>Sort by: Most Spent</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </section>

        <div className="orders-table-card">
          <table className="management-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Last Visit</th>
                <th>Loyalty Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialCustomers.map((customer, idx) => (
                <tr key={idx}>
                  <td className="customer-cell">
                    <div className="cust-info">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} 
                        alt="Avatar" 
                        className="cust-avatar-img" 
                      />
                      <div className="cust-text">
                        <span className="cust-name">{customer.name}</span>
                        <span className="cust-id">ID: #CUST-{1000 + customer.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <span className="info-item"><Mail size={14}/> {customer.email}</span>
                      <span className="info-item"><Phone size={14}/> {customer.phone}</span>
                    </div>
                  </td>
                  <td className="spent-cell">{customer.spent}</td>
                  <td>{customer.orders}</td>
                  <td className="date-cell">{customer.lastVisit}</td>
                  <td>
                    <LoyaltyBadge status={customer.status} />
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="icon-action-btn"><Edit3 size={16}/></button>
                      <button className="icon-action-btn"><MoreHorizontal size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <footer className="pagination-footer">
            <span className="showing-text">Showing 1 to 10 of 128 customers</span>
            <div className="pagination">
              <button className="page-nav"><ChevronLeft size={18}/></button>
              <button className="page-num active">1</button>
              <button className="page-num">2</button>
              <button className="page-num">3</button>
              <span className="dots">...</span>
              <button className="page-num">13</button>
              <button className="page-nav"><ChevronRight size={18}/></button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

const LoyaltyBadge = ({ status }) => {
  const config = {
    VIP: { icon: <Star size={14} fill="currentColor"/>, class: 'vip' },
    Regular: { icon: <User size={14}/>, class: 'regular' },
    New: { icon: <Plus size={14}/>, class: 'new' },
  };
  
  const { icon, class: className } = config[status] || config.Regular;
  
  return (
    <span className={`loyalty-badge ${className}`}>
      {icon} {status}
    </span>
  );
};

export default Customers;
