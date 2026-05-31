import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Download, Grid, List, ChevronDown, 
  MoreVertical, Edit3, Trash2, Filter, ChevronLeft, ChevronRight,
  Coffee, Leaf, Gem, Settings, Shirt, Gift, Box, X, AlertCircle
} from 'lucide-react';
import api from '../api/service';

const initialCategories = [
  { name: 'All Categories', icon: <Box size={18}/> },
  { name: 'Beverages', icon: <Coffee size={18}/> },
  { name: 'Matcha', icon: <Leaf size={18}/> },
  { name: 'Accessories', icon: <Gem size={18}/> },
  { name: 'Equipment', icon: <Settings size={18}/> },
  { name: 'Merchandise', icon: <Shirt size={18}/> },
  { name: 'Gift Sets', icon: <Gift size={18}/> },
];

const Products = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [stockFilter, setStockFilter] = useState('All Stock');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Category', 'Price', 'Stock'].join(','),
      ...products.map(p => [
        p.id_produk,
        `"${p.nama_produk}"`,
        p.kategori || '-',
        p.harga,
        p.stok
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        setProducts(products.filter(p => p.id_produk !== id));
        // Notify other pages (POS, etc.) that products changed
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        localStorage.setItem('products_last_updated', Date.now().toString());
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || p.kategori === selectedCategory;
      
      let matchesStock = true;
      if (stockFilter === 'In Stock') matchesStock = p.stok > 10;
      if (stockFilter === 'Low Stock') matchesStock = p.stok > 0 && p.stok <= 10;
      if (stockFilter === 'Out of Stock') matchesStock = p.stok === 0;

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'Price: Low to High') return a.harga - b.harga;
      if (sortBy === 'Price: High to Low') return b.harga - a.harga;
      if (sortBy === 'Name (A-Z)') return a.nama_produk.localeCompare(b.nama_produk);
      return b.id_produk - a.id_produk; // Newest
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryCount = (catName) => {
    if (catName === 'All Categories') return products.length;
    return products.filter(p => p.kategori === catName).length;
  };

  const notifyProductsUpdated = () => {
    // Dispatch custom event so POS and other pages can react immediately
    window.dispatchEvent(new CustomEvent('productsUpdated'));
    // Also update localStorage timestamp so other tabs can detect the change
    localStorage.setItem('products_last_updated', Date.now().toString());
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (showEditModal) {
        const result = await api.updateProduct({
          id: currentProduct.id_produk,
          nama: formData.nama_produk,
          harga: parseInt(formData.harga) || 0,
          stok: parseInt(formData.stok) || 0,
          kategori: formData.kategori,
          deskripsi: formData.deskripsi || '',
          gambar: formData.image || ''
        });
        if (result.success) {
          fetchProducts();
          notifyProductsUpdated();
          setShowEditModal(false);
        } else {
          alert('Gagal update produk: ' + (result.error || 'Unknown error'));
        }
      } else {
        const result = await api.addProduct({
          nama: formData.nama_produk,
          harga: parseInt(formData.harga) || 0,
          stok: parseInt(formData.stok) || 0,
          kategori: formData.kategori,
          deskripsi: formData.deskripsi || '',
          gambar: formData.image || ''
        });
        if (result.success) {
          fetchProducts();
          notifyProductsUpdated();
          setShowAddModal(false);
        } else {
          alert('Gagal menambah produk: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product: ' + error.message);
    }
  };

  return (
    <div className="products-page">
      <div className="sticky-header-wrapper">
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">Manage your product catalog and inventory.</p>
          </div>
          <div className="header-right">
            <button className="export-btn" onClick={handleExport}>
              <Download size={18} /> Export
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
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="dropdown-filters">
            <div className="filter-select-wrapper" style={{ position: 'relative' }}>
              <select className="filter-select-native" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}>
                <option>All Categories</option>
                {initialCategories.slice(1).map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="filter-select-wrapper" style={{ position: 'relative' }}>
              <select className="filter-select-native" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}>
                <option>All Stock</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>

            <div className="filter-select-wrapper" style={{ position: 'relative' }}>
              <select className="filter-select-native" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                <option>Newest</option>
                <option>Name (A-Z)</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              <Grid size={18} />
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              <List size={18} />
            </button>
          </div>
        </section>
      </div>

      <section className="products-content">
        <aside className="category-sidebar">
          <div className="category-header">
            <h3>Categories</h3>
            <button className="add-category" onClick={() => alert('Add Category Modal')}><Plus size={14} /> Add</button>
          </div>
          <ul className="category-list">
            {initialCategories.map((cat, idx) => (
              <li 
                key={idx} 
                className={selectedCategory === cat.name ? 'active' : ''}
                onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
              >
                <span className="cat-icon-text">
                  {cat.icon}
                  {cat.name}
                </span>
                <span className="cat-count">{getCategoryCount(cat.name)}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="products-grid-container">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>Loading products...</div>
          ) : (
            <div className={viewMode === 'grid' ? 'products-grid' : 'products-list-view'}>
              {currentProducts.map((product) => (
                <ProductCard 
                  key={product.id_produk} 
                  product={product} 
                  viewMode={viewMode} 
                  onEdit={(p) => { setCurrentProduct(p); setShowEditModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
              {currentProducts.length === 0 && (
                <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#999' }}>
                  No products found matching your criteria.
                </div>
              )}
            </div>
          )}
          
          <footer className="pagination-footer">
            <span className="showing-text">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </span>
            <div className="pagination">
              <button className="page-nav" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}><ChevronLeft size={18}/></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} className={`page-num ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="page-nav" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}><ChevronRight size={18}/></button>
            </div>
          </footer>
        </div>
      </section>

      {/* Product Modal */}
      {(showAddModal || showEditModal) && (
        <ProductModal 
          product={currentProduct} 
          onClose={() => { setShowAddModal(false); setShowEditModal(false); setCurrentProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState(product || {
    nama_produk: '',
    kategori: 'Beverages',
    harga: '',
    stok: '',
    image: null
  });
  const fileInputRef = React.useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        setFormData({ ...formData, image: readerEvent.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="close-btn" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="modal-body">
          <div className="image-upload-section" onClick={() => fileInputRef.current.click()}>
            {formData.image ? (
              <img src={formData.image} alt="Preview" className="img-preview" />
            ) : (
              <div className="upload-placeholder-content">
                <Plus size={32} />
                <span>Upload Product Photo</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              style={{ display: 'none' }} 
              accept="image/*"
            />
          </div>

          <div className="form-group">
            <label>Product Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.nama_produk} 
              onChange={(e) => setFormData({...formData, nama_produk: e.target.value})}
              placeholder="e.g. Matcha Latte"
            />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Category</label>
              <select 
                className="input-field" 
                value={formData.kategori}
                onChange={(e) => setFormData({...formData, kategori: e.target.value})}
              >
                {initialCategories.slice(1).map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Price (Rp)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.harga}
                onChange={(e) => setFormData({...formData, harga: e.target.value})}
                placeholder="25000"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Initial Stock</label>
            <input 
              type="number" 
              className="input-field" 
              value={formData.stok}
              onChange={(e) => setFormData({...formData, stok: e.target.value})}
              placeholder="50"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={() => onSave(formData)}>Save Product</button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, viewMode, onEdit, onDelete }) => (
  <div className={viewMode === 'grid' ? 'product-card-premium' : 'product-list-item-premium'}>
    <div className="product-image-placeholder">
      {product.gambar || product.image ? (
        <img src={product.gambar || product.image} alt={product.nama_produk} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div className="img-icon">🍵</div>
      )}
    </div>
    <div className="product-card-body">
      <div className="product-main-info">
        <h4 className="p-name">{product.nama_produk}</h4>
        <span className="p-cat">{product.kategori || 'Uncategorized'}</span>
        <div className="p-price">Rp {parseInt(product.harga).toLocaleString('id-ID')}</div>
      </div>
      <div className={`p-stock ${product.stok <= 10 ? 'low-stock' : 'in-stock'}`}>
        <span className="dot"></span> {product.stok} pcs in stock
      </div>
      <div className="product-card-actions">
        <button className="edit-btn" onClick={() => onEdit(product)}><Edit3 size={16} /> Edit</button>
        <button className="delete-btn" onClick={() => onDelete(product.id_produk)}><Trash2 size={16} /> Delete</button>
      </div>
    </div>
  </div>
);

export default Products;
