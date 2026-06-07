import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Download, Grid, List, 
  Edit3, Trash2, ChevronLeft, ChevronRight,
  X, Loader, AlertCircle
} from 'lucide-react';
import api from '../api/service';

const Products = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  useEffect(() => {
    fetchProducts();

    // Re-fetch when POS or other pages add/edit/delete products
    const handleProductsUpdated = () => {
      fetchProducts();
    };
    window.addEventListener('productsUpdated', handleProductsUpdated);

    // Re-fetch when tab becomes visible (e.g. switching back from POS tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Re-fetch on window focus (switching between browser tabs)
    const handleWindowFocus = () => {
      fetchProducts();
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
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
    if (!window.confirm('Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      const result = await api.deleteProduct(id);
      if (result && result.success === true) {
        setProducts(prev => prev.filter(p => p.id_produk !== id));
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        localStorage.setItem('products_last_updated', Date.now().toString());
      } else {
        alert('Gagal menghapus produk: ' + (result?.error || 'Terjadi kesalahan pada server. Silakan coba lagi.'));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk. Silakan coba lagi.');
    }
  };

  const filteredProducts = products
    .filter(p => {
      return p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'Price: Low to High') return a.harga - b.harga;
      if (sortBy === 'Price: High to Low') return b.harga - a.harga;
      if (sortBy === 'Name (A-Z)') return a.nama_produk.localeCompare(b.nama_produk);
      return b.id_produk - a.id_produk; // Newest
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const notifyProductsUpdated = () => {
    // Dispatch custom event so POS and other pages can react immediately
    window.dispatchEvent(new CustomEvent('productsUpdated'));
    // Also update localStorage timestamp so other tabs can detect the change
    localStorage.setItem('products_last_updated', Date.now().toString());
  };

  // Compress image before sending to API
  const compressImage = (base64, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });
  };

  const handleSaveProduct = async (formData) => {
    try {
      // Compress image if present
      let gambar = formData.image || '';
      if (gambar && gambar.startsWith('data:image')) {
        gambar = await compressImage(gambar);
      }

      if (showEditModal) {
        const result = await api.updateProduct({
          id: currentProduct.id_produk,
          nama: formData.nama_produk,
          harga: parseInt(formData.harga) || 0,
          stok: parseInt(formData.stok) || 0,
          kategori: formData.kategori,
          deskripsi: formData.deskripsi || '',
          gambar: gambar
        });
        if (result.success) {
          fetchProducts();
          notifyProductsUpdated();
          setShowEditModal(false);
        } else {
          alert('Gagal update produk: ' + (result.error || 'Terjadi kesalahan pada server.'));
        }
      } else {
        const result = await api.addProduct({
          nama: formData.nama_produk,
          harga: parseInt(formData.harga) || 0,
          stok: parseInt(formData.stok) || 0,
          kategori: formData.kategori,
          deskripsi: formData.deskripsi || '',
          gambar: gambar
        });
        if (result.success) {
          fetchProducts();
          notifyProductsUpdated();
          setShowAddModal(false);
        } else {
          alert('Gagal menambah produk: ' + (result.error || 'Terjadi kesalahan pada server.'));
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Gagal menyimpan produk: ' + error.message);
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
  const [formData, setFormData] = useState(product ? {
    nama_produk: product.nama_produk || '',
    kategori: product.kategori || '',
    harga: product.harga || '',
    stok: product.stok || '',
    image: product.gambar || null,
    deskripsi: product.deskripsi || ''
  } : {
    nama_produk: '',
    kategori: '',
    harga: '',
    stok: '',
    image: null,
    deskripsi: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran gambar maksimal 5MB');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setFormData({ ...formData, image: readerEvent.target.result });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nama_produk.trim()) {
      newErrors.nama_produk = 'Nama produk wajib diisi';
    }
    if (!formData.harga || parseInt(formData.harga) <= 0) {
      newErrors.harga = 'Harga harus diisi dan lebih dari 0';
    }
    if (formData.stok === '' || parseInt(formData.stok) < 0) {
      newErrors.stok = 'Stok harus diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrorMessage('');
    try {
      await onSave(formData);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="close-btn" onClick={onClose} disabled={saving}><X size={20}/></button>
        </div>
        <div className="modal-body">
          {errorMessage && (
            <div style={{ padding: '0.75rem', marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div className="image-upload-section" onClick={() => !saving && fileInputRef.current.click()}>
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
            <label>Product Name <span style={{color: '#dc2626'}}>*</span></label>
            <input 
              type="text" 
              className={`input-field ${errors.nama_produk ? 'input-error' : ''}`} 
              value={formData.nama_produk} 
              onChange={(e) => { setFormData({...formData, nama_produk: e.target.value}); setErrors({...errors, nama_produk: ''}); }}
              placeholder="e.g. Matcha Latte"
              disabled={saving}
            />
            {errors.nama_produk && <span style={{color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>{errors.nama_produk}</span>}
          </div>
          <div className="form-group">
              <label>Price (Rp) <span style={{color: '#dc2626'}}>*</span></label>
              <input 
                type="number" 
                className={`input-field ${errors.harga ? 'input-error' : ''}`} 
                value={formData.harga}
                onChange={(e) => { setFormData({...formData, harga: e.target.value}); setErrors({...errors, harga: ''}); }}
                placeholder="25000"
                disabled={saving}
              />
              {errors.harga && <span style={{color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>{errors.harga}</span>}
            </div>

          <div className="form-group">
            <label>Initial Stock <span style={{color: '#dc2626'}}>*</span></label>
            <input 
              type="number" 
              className={`input-field ${errors.stok ? 'input-error' : ''}`} 
              value={formData.stok}
              onChange={(e) => { setFormData({...formData, stok: e.target.value}); setErrors({...errors, stok: ''}); }}
              placeholder="50"
              disabled={saving}
            />
            {errors.stok && <span style={{color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>{errors.stok}</span>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader size={16} style={{animation: 'spin 1s linear infinite'}} /> Saving...</> : 'Save Product'}
          </button>
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
