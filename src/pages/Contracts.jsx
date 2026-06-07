import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Filter, ChevronDown, 
  Eye, Edit3, Trash2, CheckCircle, AlertTriangle, 
  Clock, ChevronLeft, ChevronRight, MoreVertical,
  X, Save, Truck, Building, Briefcase, Calendar, DollarSign
} from 'lucide-react';
import api from '../api/service';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
};

const parseRupiah = (str) => {
  if (typeof str === 'number') return str;
  return parseInt(str.replace(/[^\d]/g, '')) || 0;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Contracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    draft: 0,
    expiring_soon: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    status: 'Semua Status', 
    tipe: 'Semua Tipe', 
    search: '' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tipe_kontrak: 'supplier',
    nama_pihak_kedua: '',
    email_pihak: '',
    tanggal_kontrak: new Date().toISOString().split('T')[0],
    durasi_bulan: 12,
    masa_berlaku: '',
    nilai_kontrak: 0,
    isi_kontrak: '',
    catatan: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    calculateExpiry();
  }, [formData.tanggal_kontrak, formData.durasi_bulan]);

  const calculateExpiry = () => {
    if (formData.tanggal_kontrak && formData.durasi_bulan) {
      const startDate = new Date(formData.tanggal_kontrak);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.durasi_bulan));
      endDate.setDate(endDate.getDate() - 1);
      
      const expiryDate = endDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, masa_berlaku: expiryDate }));
    }
  };

  const loadContracts = async () => {
    setLoading(true);
    try {
      const [contractsResult, statsResult] = await Promise.all([
        api.getContracts(),
        api.getContractStats()
      ]);

      if (Array.isArray(contractsResult)) {
        setContracts(contractsResult);
      } else {
        setContracts([]);
      }
      
      if (statsResult) {
        setStats({
          total: statsResult.total || 0,
          aktif: statsResult.aktif || 0,
          draft: statsResult.draft || 0,
          expiring_soon: statsResult.expiring_soon || 0
        });
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEdit(false);
    setFormData({
      tipe_kontrak: 'supplier',
      nama_pihak_kedua: '',
      email_pihak: '',
      tanggal_kontrak: new Date().toISOString().split('T')[0],
      durasi_bulan: 12,
      masa_berlaku: '',
      nilai_kontrak: 0,
      isi_kontrak: '',
      catatan: ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (contract) => {
    setIsEdit(true);
    
    // Calculate duration in months
    const startDate = new Date(contract.tanggal_kontrak);
    const endDate = new Date(contract.masa_berlaku);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth()) + 1;

    setFormData({
      id_kontrak: contract.id_kontrak,
      tipe_kontrak: contract.tipe_kontrak || 'supplier',
      nama_pihak_kedua: contract.nama_pihak_kedua || '',
      email_pihak: contract.email_pihak || '',
      tanggal_kontrak: contract.tanggal_kontrak || '',
      durasi_bulan: monthsDiff || 12,
      masa_berlaku: contract.masa_berlaku || '',
      nilai_kontrak: contract.nilai_kontrak || 0,
      isi_kontrak: contract.isi_kontrak || '',
      catatan: contract.catatan || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nilai_kontrak') {
      setFormData({ ...formData, [name]: parseRupiah(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nama_pihak_kedua.trim()) newErrors.nama_pihak_kedua = 'Nama pihak kedua wajib diisi';
    if (!formData.tanggal_kontrak) newErrors.tanggal_kontrak = 'Tanggal kontrak wajib diisi';
    if (!formData.nilai_kontrak || formData.nilai_kontrak <= 0) newErrors.nilai_kontrak = 'Nilai kontrak harus lebih dari 0';
    if (!formData.isi_kontrak.trim()) newErrors.isi_kontrak = 'Deskripsi kontrak wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = { ...formData, status: isEdit ? undefined : 'draft' };
      let result;
      if (isEdit) {
        result = await api.updateContract(data);
      } else {
        result = await api.createContract(data);
      }

      if (result.success) {
        setShowModal(false);
        loadContracts();
      } else {
        alert('Gagal menyimpan kontrak: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Terjadi kesalahan saat menyimpan kontrak');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kontrak ini?')) {
      try {
        await api.deleteContract(id);
        loadContracts();
      } catch (error) {
        alert('Gagal menghapus kontrak');
      }
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = (c.nama_pihak_kedua?.toLowerCase().includes(filters.search.toLowerCase())) || 
                         (c.nomor_kontrak?.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesStatus = filters.status === 'Semua Status' || 
                         (filters.status === 'Aktif' && c.status === 'aktif') ||
                         (filters.status === 'Draft' && c.status === 'draft') ||
                         (filters.status === 'Akan Berakhir' && c.status === 'akan_berakhir');
    const matchesTipe = filters.tipe === 'Semua Tipe' || 
                       c.tipe_kontrak?.toLowerCase() === filters.tipe.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesTipe;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const currentItems = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'aktif': return { label: 'Aktif', color: '#10b981' };
      case 'draft': return { label: 'Draft', color: '#f59e0b' };
      case 'akan_berakhir': return { label: 'Akan Berakhir', color: '#f97316' };
      default: return { label: status, color: '#6b7280' };
    }
  };

  const getTypeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'supplier': return 'badge-supplier';
      case 'rental': return 'badge-rental';
      case 'employment': return 'badge-employment';
      default: return 'badge-default';
    }
  };

  const contractTypes = [
    { value: 'supplier', label: 'Kontrak Supplier', icon: <Truck size={18} />, desc: 'Pengadaan barang/jasa' },
    { value: 'rental', label: 'Perjanjian Sewa', icon: <Building size={18} />, desc: 'Sewa tempat/equipment' },
    { value: 'employment', label: 'Kontrak Kerja', icon: <Briefcase size={18} />, desc: 'Kontrak kerja karyawan' }
  ];

  return (
    <div className="contracts-page">
      <header className="main-header">
        <div className="header-left">
          <h1 className="page-title">Manajemen Kontrak</h1>
          <p className="page-subtitle">Kelola kontrak bisnis MiMatcha</p>
        </div>
        <div className="header-right">
          <button className="btn-add-contract" onClick={handleOpenAddModal}>
            <Plus size={20} />
            <span>Buat Kontrak</span>
          </button>
        </div>
      </header>

      <section className="contracts-stats">
        <div className="stat-item">
          <div className="stat-icon purple">
            <FileText size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Kontrak</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Aktif</span>
            <span className="stat-value">{stats.aktif}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon yellow">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Draft</span>
            <span className="stat-value">{stats.draft}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon orange">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Akan Berakhir</span>
            <span className="stat-value">{stats.expiring_soon}</span>
          </div>
        </div>
      </section>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari kontrak..." 
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <div className="filter-controls">
          <button className="filter-btn">
            <Filter size={18} />
          </button>
          <div className="select-wrapper">
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option>Semua Status</option>
              <option>Aktif</option>
              <option>Draft</option>
              <option>Akan Berakhir</option>
            </select>
            <ChevronDown size={16} className="chevron" />
          </div>
          <div className="select-wrapper">
            <select 
              value={filters.tipe}
              onChange={(e) => setFilters({...filters, tipe: e.target.value})}
            >
              <option>Semua Tipe</option>
              <option>Supplier</option>
              <option>Rental</option>
              <option>Employment</option>
            </select>
            <ChevronDown size={16} className="chevron" />
          </div>
        </div>
      </div>

      <div className="contracts-table-card">
        <table className="contracts-table">
          <thead>
            <tr>
              <th>Nomor Kontrak <MoreVertical size={14} className="sort-icon" /></th>
              <th>Nama Pihak <MoreVertical size={14} className="sort-icon" /></th>
              <th>Tipe <MoreVertical size={14} className="sort-icon" /></th>
              <th>Nilai <MoreVertical size={14} className="sort-icon" /></th>
              <th>Tanggal Mulai <MoreVertical size={14} className="sort-icon" /></th>
              <th>Masa Berlaku <MoreVertical size={14} className="sort-icon" /></th>
              <th>Status <MoreVertical size={14} className="sort-icon" /></th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Memuat data...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Tidak ada kontrak ditemukan</td></tr>
            ) : (
              currentItems.map((contract) => (
                <tr key={contract.id_kontrak}>
                  <td className="font-medium">{contract.nomor_kontrak || `MMTC-2024-${String(contract.id_kontrak).padStart(3, '0')}`}</td>
                  <td className="font-medium">{contract.nama_pihak_kedua}</td>
                  <td>
                    <span className={`badge ${getTypeClass(contract.tipe_kontrak)}`}>
                      {contract.tipe_kontrak || 'General'}
                    </span>
                  </td>
                  <td className="font-medium">{formatRupiah(contract.nilai_kontrak)}</td>
                  <td>{formatDate(contract.tanggal_kontrak)}</td>
                  <td>{contract.durasi || '12 Bulan'}</td>
                  <td>
                    <div className="status-cell">
                      <span className="status-dot" style={{ backgroundColor: getStatusInfo(contract.status).color }}></span>
                      <span className="status-text">{getStatusInfo(contract.status).label}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => navigate(`/contracts/${contract.id_kontrak}`)} title="View"><Eye size={18} /></button>
                      <button className="action-btn" onClick={() => handleOpenEditModal(contract)} title="Edit"><Edit3 size={18} /></button>
                      <button className="action-btn delete" onClick={() => handleDelete(contract.id_kontrak)} title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <footer className="table-footer">
          <span className="showing-text">
            Menampilkan {(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, filteredContracts.length)} dari {filteredContracts.length} kontrak
          </span>
          <div className="pagination">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </div>

      {/* Modal Card Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <div className="modal-title-box">
                <div className="modal-icon-bg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3>{isEdit ? 'Edit Kontrak' : 'Buat Kontrak Baru'}</h3>
                  <p>Isi detail kontrak bisnis di bawah ini</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-sections-container">
                {/* Tipe Kontrak */}
                <div className="modal-form-section">
                  <label className="section-label">Pilih Tipe Kontrak</label>
                  <div className="type-grid">
                    {contractTypes.map(type => (
                      <label 
                        key={type.value} 
                        className={`type-card ${formData.tipe_kontrak === type.value ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="tipe_kontrak"
                          value={type.value}
                          checked={formData.tipe_kontrak === type.value}
                          onChange={handleFormChange}
                        />
                        <div className="type-icon-box">{type.icon}</div>
                        <div className="type-info">
                          <span className="type-label">{type.label}</span>
                          <span className="type-desc">{type.desc}</span>
                        </div>
                        {formData.tipe_kontrak === type.value && <CheckCircle size={16} className="check-icon" />}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nama Pihak Kedua <span className="req">*</span></label>
                    <input
                      type="text"
                      name="nama_pihak_kedua"
                      value={formData.nama_pihak_kedua}
                      onChange={handleFormChange}
                      placeholder="Contoh: PT. Sari Alam Makmur"
                      className={errors.nama_pihak_kedua ? 'error' : ''}
                    />
                    {errors.nama_pihak_kedua && <span className="err-msg">{errors.nama_pihak_kedua}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email Pihak Kedua</label>
                    <input
                      type="email"
                      name="email_pihak"
                      value={formData.email_pihak}
                      onChange={handleFormChange}
                      placeholder="email@perusahaan.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tanggal Mulai <span className="req">*</span></label>
                    <div className="input-with-icon">
                      <Calendar size={16} className="inner-icon" />
                      <input
                        type="date"
                        name="tanggal_kontrak"
                        value={formData.tanggal_kontrak}
                        onChange={handleFormChange}
                        className={errors.tanggal_kontrak ? 'error' : ''}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Durasi (Bulan)</label>
                    <input
                      type="number"
                      name="durasi_bulan"
                      value={formData.durasi_bulan}
                      onChange={handleFormChange}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Masa Berlaku</label>
                    <input
                      type="date"
                      value={formData.masa_berlaku}
                      readOnly
                      className="readonly"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nilai Kontrak (Rp) <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <span className="currency-label">Rp</span>
                    <input
                      type="text"
                      name="nilai_kontrak"
                      value={formData.nilai_kontrak === 0 ? '' : formData.nilai_kontrak.toLocaleString('id-ID')}
                      onChange={handleFormChange}
                      placeholder="0"
                      className={errors.nilai_kontrak ? 'error' : ''}
                    />
                  </div>
                  {errors.nilai_kontrak && <span className="err-msg">{errors.nilai_kontrak}</span>}
                </div>

                <div className="form-group">
                  <label>Isi Kontrak <span className="req">*</span></label>
                  <textarea
                    name="isi_kontrak"
                    value={formData.isi_kontrak}
                    onChange={handleFormChange}
                    placeholder="Jelaskan detail cakupan kontrak..."
                    rows={4}
                    className={errors.isi_kontrak ? 'error' : ''}
                  />
                  {errors.isi_kontrak && <span className="err-msg">{errors.isi_kontrak}</span>}
                </div>
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  <Save size={18} />
                  <span>{submitting ? 'Menyimpan...' : (isEdit ? 'Update Kontrak' : 'Simpan Kontrak')}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .contracts-page {
          padding: 24px;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        .contracts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-info h1 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .header-info p {
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .btn-add-contract {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #2d4a3e;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-contract:hover {
          background-color: #1e3a2e;
          transform: translateY(-1px);
        }

        .contracts-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-item {
          background: white;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.purple { background-color: #ede9fe; color: #7c3aed; }
        .stat-icon.green { background-color: #dcfce7; color: #16a34a; }
        .stat-icon.yellow { background-color: #fef3c7; color: #d97706; }
        .stat-icon.orange { background-color: #ffedd5; color: #ea580c; }

        .stat-details {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background-color: white;
          outline: none;
        }

        .filter-controls {
          display: flex;
          gap: 12px;
        }

        .filter-btn {
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #64748b;
          cursor: pointer;
        }

        .select-wrapper {
          position: relative;
          min-width: 160px;
        }

        .select-wrapper select {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          appearance: none;
          outline: none;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
        }

        .select-wrapper .chevron {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .contracts-table-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .contracts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .contracts-table th {
          text-align: left;
          padding: 16px;
          background-color: #fcfdfd;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-size: 14px;
          font-weight: 600;
        }

        .sort-icon {
          color: #cbd5e1;
          vertical-align: middle;
          margin-left: 4px;
        }

        .contracts-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-size: 14px;
        }

        .font-medium {
          font-weight: 500;
          color: #1e293b;
        }

        .badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-supplier { background-color: #f0fdf4; color: #16a34a; }
        .badge-rental { background-color: #fffbeb; color: #d97706; }
        .badge-employment { background-color: #eff6ff; color: #2563eb; }
        .badge-default { background-color: #f1f5f9; color: #475569; }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-text {
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .action-btn.delete:hover {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
        }

        .table-footer {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
        }

        .showing-text {
          font-size: 14px;
          color: #64748b;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-num {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
        }

        .page-num.active {
          background-color: #2d4a3e;
          color: white;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-card {
          background: white;
          width: 100%;
          max-width: 800px;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          animation: modalSlideUp 0.3s ease-out;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title-box {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .modal-icon-bg {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2d4a3e;
        }

        .modal-title-box h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }

        .modal-title-box p {
          margin: 4px 0 0;
          font-size: 0.875rem;
          color: #64748b;
        }

        .modal-close {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .modal-form {
          max-height: 70vh;
          overflow-y: auto;
        }

        .form-sections-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .modal-form-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .type-card {
          position: relative;
          padding: 16px;
          border: 2px solid #f1f5f9;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .type-card input {
          position: absolute;
          opacity: 0;
        }

        .type-card:hover {
          border-color: #e2e8f0;
        }

        .type-card.active {
          border-color: #2d4a3e;
          background: #f0fdf4;
        }

        .type-icon-box {
          width: 32px;
          height: 32px;
          background: #f8fafc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .type-card.active .type-icon-box {
          background: #2d4a3e;
          color: white;
        }

        .type-info {
          display: flex;
          flex-direction: column;
        }

        .type-label {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #1e293b;
        }

        .type-desc {
          font-size: 0.75rem;
          color: #64748b;
        }

        .check-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          color: #16a34a;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .req { color: #ef4444; }

        .form-group input, 
        .form-group textarea {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.2s;
        }

        .form-group input:focus, 
        .form-group textarea:focus {
          border-color: #2d4a3e;
          box-shadow: 0 0 0 3px rgba(45, 74, 62, 0.1);
        }

        .form-group input.error, 
        .form-group textarea.error {
          border-color: #ef4444;
        }

        .input-with-icon {
          position: relative;
        }

        .inner-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .input-with-icon input {
          width: 100%;
          padding-left: 40px;
        }

        .currency-label {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: #64748b;
        }

        .input-with-icon input[name="nilai_kontrak"] {
          padding-left: 44px;
        }

        .readonly {
          background: #f8fafc;
          cursor: not-allowed;
          color: #64748b;
        }

        .err-msg {
          font-size: 0.75rem;
          color: #ef4444;
          font-weight: 500;
        }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fafc;
        }

        .modal-footer button {
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .btn-cancel:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .btn-save {
          background: #2d4a3e;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-save:hover {
          background: #1e3a2e;
          transform: translateY(-1px);
        }

        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Contracts;
