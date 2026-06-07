import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Download, Edit3, Trash2,
  ChevronDown, ChevronLeft, ChevronRight, Package,
  Truck, Archive, AlertTriangle, Layers, BarChart, X, Upload
} from 'lucide-react';
import api from '../api/service';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    stockValue: 0
  });
  const [editItem, setEditItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory();
      if (data && Array.isArray(data)) {
        setInventory(data);
        calculateStats(data);
      } else {
        setInventory([]);
        calculateStats([]);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalItems = data.length;
    const lowStock = data.filter(item => item.stok > 0 && item.stok <= 10).length;
    const outOfStock = data.filter(item => item.stok === 0).length;
    const stockValue = data.reduce((sum, item) => sum + (item.harga * item.stok), 0);

    setStats({ totalItems, lowStock, outOfStock, stockValue });
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `PRD-${item.id_produk}`.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStockStatus(item.stok);
    const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = async (newData) => {
    const newItem = { ...newData, id_produk: Date.now() };
    const newInventory = [newItem, ...inventory];
    setInventory(newInventory);
    calculateStats(newInventory);
    setShowAddModal(false);
    alert('New item added successfully');
  };

  const handleUpdateItem = async (updatedData) => {
    const newInventory = inventory.map(item => item.id_produk === updatedData.id_produk ? updatedData : item);
    setInventory(newInventory);
    calculateStats(newInventory);
    setShowEditModal(false);
    alert('Item updated successfully');
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const newInventory = inventory.filter(item => item.id_produk !== id);
      setInventory(newInventory);
      calculateStats(newInventory);
      alert('Item deleted successfully');
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Nama Produk', 'Kategori', 'Stok', 'Harga', 'Status'].join(','),
      ...filteredInventory.map(item => [
        item.id_produk,
        `"${item.nama_produk}"`,
        item.kategori || '-',
        item.stok,
        item.harga,
        getStockStatus(item.stok)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="inventory-page">
      <div className="sticky-header-wrapper">
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">Inventory Management</h1>
            <p className="page-subtitle">Monitor and control your stock levels across all categories.</p>
          </div>
          <div className="header-right">
            <button className="export-btn" onClick={handleExport}>
              <Download size={18} /> Export Report
            </button>
            <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add New Product
            </button>
          </div>
        </header>

        <section className="filter-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by SKU, product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="dropdown-filters">
            <div className="filter-select-wrapper">
              <Archive size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
              <select 
                className="filter-select-native" 
                style={{ paddingLeft: '32px' }}
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="in stock">In Stock</option>
                <option value="low stock">Low Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      <section className="inventory-stats stats-grid">
        <StatCard icon={<Package size={20} />} title="Total Items" value={stats.totalItems} trend={`${stats.totalItems} produk`} color="green" />
        <StatCard icon={<AlertTriangle size={20} />} title="Low Stock" value={stats.lowStock} trend="Perlu restock" color="orange" />
        <StatCard icon={<Layers size={20} />} title="Out of Stock" value={stats.outOfStock} trend="Habis" color="purple" />
        <StatCard icon={<BarChart size={20} />} title="Stock Value" value={`Rp ${stats.stockValue.toLocaleString('id-ID')}`} trend="Total nilai" color="blue" />
      </section>

      <div className="orders-table-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className="management-table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id_produk}>
                  <td>
                    <div className="item-cell">
                      <div className="item-thumb">
                        {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍵'}
                      </div>
                      <div className="item-meta">
                        <span className="item-name-bold">{item.nama_produk}</span>
                        <span className="item-sku-small">SKU: PRD-{item.id_produk}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.kategori || '-'}</td>
                  <td>
                    <div className="price-stack">
                      <span className="price-val">Rp {parseInt(item.harga).toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td>
                    <div className="stock-level">
                      <span className="stock-qty">{item.stok}</span>
                      <div className="stock-bar-bg">
                        <div
                          className={`stock-bar-fill ${getStockStatus(item.stok).toLowerCase().replace(' ', '-')}`}
                          style={{ width: `${Math.min(100, (item.stok / 100) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StockStatusBadge status={getStockStatus(item.stok)} />
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="icon-action-btn edit"
                        onClick={() => { setEditItem(item); setShowEditModal(true); }}
                        title="Edit Item"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-action-btn delete"
                        onClick={() => handleDeleteItem(item.id_produk)}
                        title="Delete Item"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="pagination-footer">
          <span className="showing-text">Showing {filteredInventory.length} of {inventory.length} items</span>
        </footer>
      </div>

      {showAddModal && (
        <EditInventoryModal
          item={null}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddItem}
        />
      )}

      {showEditModal && editItem && (
        <EditInventoryModal
          item={editItem}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateItem}
        />
      )}
    </div>
  );
};

const EditInventoryModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState(item || {
    nama_produk: '',
    kategori: 'Matcha',
    harga: '',
    stok: '',
    image: null
  });
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setFormData({ ...formData, image: re.target.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{item ? 'Edit Product Details' : 'Add New Product'}</h3>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="edit-grid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '2rem' }}>
            <div className="image-upload-col">
              <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Product Photo</label>
              <div 
                className="image-upload-square" 
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '16px',
                  border: '2px dashed #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#f8fafc'
                }}
              >
                {formData.image ? (
                  <img src={formData.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <Plus size={24} />
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Upload</div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} accept="image/*" />
              </div>
            </div>
            
            <div className="fields-col">
              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Product Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.nama_produk} 
                  onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-field">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Category</label>
                  <select 
                    className="input-field" 
                    value={formData.kategori} 
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  >
                    <option>Matcha</option>
                  </select>
                </div>
                <div className="form-field">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Price (Rp)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.harga} 
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-field">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Stock Quantity</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.stok} 
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })} 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={() => onSave(formData)}>{item ? 'Update Item' : 'Save Product'}</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-header">
      <div className="stat-icon">{icon}</div>
      <span className="stat-title">{title}</span>
    </div>
    <div className="stat-content">
      <h2 className="stat-value">{value}</h2>
      <div className="stat-trend">
        <span>{trend}</span>
      </div>
    </div>
  </div>
);

const StockStatusBadge = ({ status }) => {
  const config = {
    'In Stock': { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
    'Low Stock': { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
    'Out of Stock': { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  };

  const style = config[status] || config['In Stock'];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.color
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: style.dot
      }}></span>
      {status}
    </span>
  );
};

export default Inventory;
