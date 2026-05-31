import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, X, Truck, Building, Briefcase, Calendar,
  DollarSign, FileText, AlertCircle
} from 'lucide-react';
import api from '../api/service';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
};

const parseRupiah = (str) => {
  return parseInt(str.replace(/[^\d]/g, '')) || 0;
};

const ContractForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipe_kontrak: 'supplier',
    nama_pihak_kedua: '',
    email_pihak: '',
    tanggal_kontrak: new Date().toISOString().split('T')[0],
    durasi_bulan: 12,
    masa_berlaku: '',
    nilai_kontrak: '',
    isi_kontrak: '',
    catatan: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadContract();
    } else {
      calculateExpiry();
    }
  }, [id]);

  useEffect(() => {
    calculateExpiry();
  }, [formData.tanggal_kontrak, formData.durasi_bulan]);

  const loadContract = async () => {
    setLoading(true);
    const contract = await api.getContract(id);
    if (contract) {
      const startDate = new Date(contract.tanggal_kontrak);
      const endDate = new Date(contract.masa_berlaku);
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());

      setFormData({
        tipe_kontrak: contract.tipe_kontrak || 'supplier',
        nama_pihak_kedua: contract.nama_pihak_kedua || '',
        email_pihak: contract.email_pihak || '',
        tanggal_kontrak: contract.tanggal_kontrak || '',
        durasi_bulan: monthsDiff || 12,
        masa_berlaku: contract.masa_berlaku || '',
        nilai_kontrak: contract.nilai_kontrak || '',
        isi_kontrak: contract.isi_kontrak || '',
        catatan: contract.catatan || ''
      });
    }
    setLoading(false);
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'nilai_kontrak') {
      const numValue = parseRupiah(value);
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nama_pihak_kedua.trim()) {
      newErrors.nama_pihak_kedua = 'Nama pihak kedua wajib diisi';
    }
    
    if (!formData.tanggal_kontrak) {
      newErrors.tanggal_kontrak = 'Tanggal kontrak wajib diisi';
    }
    
    if (!formData.nilai_kontrak || formData.nilai_kontrak <= 0) {
      newErrors.nilai_kontrak = 'Nilai kontrak harus lebih dari 0';
    }
    
    if (!formData.isi_kontrak.trim()) {
      newErrors.isi_kontrak = 'Deskripsi kontrak wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    
    try {
      const data = {
        ...formData,
        status: 'draft'
      };

      let result;
      if (isEdit) {
        result = await api.updateContract({ ...data, id_kontrak: id });
      } else {
        result = await api.createContract(data);
      }

      if (result.success) {
        navigate('/contracts');
      } else {
        alert('Gagal menyimpan kontrak: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Terjadi kesalahan saat menyimpan kontrak');
    }
    
    setLoading(false);
  };

  const getTypeIcon = (tipe) => {
    switch (tipe) {
      case 'supplier': return <Truck size={20} />;
      case 'rental': return <Building size={20} />;
      case 'employment': return <Briefcase size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const contractTypes = [
    { value: 'supplier', label: 'Kontrak Supplier', icon: <Truck size={18} />, desc: 'Kontrak pengadaan barang/jasa' },
    { value: 'rental', label: 'Perjanjian Sewa', icon: <Building size={18} />, desc: 'Kontrak sewa tempat/equipment' },
    { value: 'employment', label: 'Kontrak Kerja', icon: <Briefcase size={18} />, desc: 'Kontrak kerja karyawan' }
  ];

  if (loading && isEdit) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Memuat data kontrak...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <button className="back-btn" onClick={() => navigate('/contracts')}>
          <ArrowLeft size={20} />
          <span>Kembali</span>
        </button>
        <h1>{isEdit ? 'Edit Kontrak' : 'Buat Kontrak Baru'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="contract-form">
        <div className="form-section">
          <h2 className="section-title">Tipe Kontrak</h2>
          <div className="type-selector">
            {contractTypes.map(type => (
              <label 
                key={type.value} 
                className={`type-option ${formData.tipe_kontrak === type.value ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="tipe_kontrak"
                  value={type.value}
                  checked={formData.tipe_kontrak === type.value}
                  onChange={handleChange}
                />
                <div className="type-icon">{type.icon}</div>
                <div className="type-info">
                  <span className="type-label">{type.label}</span>
                  <span className="type-desc">{type.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Informasi Pihak Kedua</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nama_pihak_kedua">
                Nama Pihak Kedua <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nama_pihak_kedua"
                name="nama_pihak_kedua"
                value={formData.nama_pihak_kedua}
                onChange={handleChange}
                placeholder="Nama perusahaan atau individu"
                className={errors.nama_pihak_kedua ? 'error' : ''}
              />
              {errors.nama_pihak_kedua && (
                <span className="error-message">{errors.nama_pihak_kedua}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email_pihak">Email</label>
              <input
                type="email"
                id="email_pihak"
                name="email_pihak"
                value={formData.email_pihak}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Tanggal & Durasi</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tanggal_kontrak">
                Tanggal Mulai <span className="required">*</span>
              </label>
              <input
                type="date"
                id="tanggal_kontrak"
                name="tanggal_kontrak"
                value={formData.tanggal_kontrak}
                onChange={handleChange}
                className={errors.tanggal_kontrak ? 'error' : ''}
              />
              {errors.tanggal_kontrak && (
                <span className="error-message">{errors.tanggal_kontrak}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="durasi_bulan">Durasi (bulan)</label>
              <input
                type="number"
                id="durasi_bulan"
                name="durasi_bulan"
                value={formData.durasi_bulan}
                onChange={handleChange}
                min="1"
                max="120"
              />
            </div>

            <div className="form-group">
              <label htmlFor="masa_berlaku">Berlaku Hingga</label>
              <input
                type="date"
                id="masa_berlaku"
                name="masa_berlaku"
                value={formData.masa_berlaku}
                readOnly
                className="readonly"
              />
              <span className="helper-text">Otomatis dihitung dari tanggal mulai + durasi</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Nilai Kontrak</h2>
          <div className="form-group">
            <label htmlFor="nilai_kontrak">
              Nilai Kontrak (Rp) <span className="required">*</span>
            </label>
            <div className="currency-input">
              <span className="currency-prefix">Rp</span>
              <input
                type="text"
                id="nilai_kontrak"
                name="nilai_kontrak"
                value={formatRupiah(formData.nilai_kontrak).replace('Rp', '').trim()}
                onChange={handleChange}
                placeholder="0"
                className={errors.nilai_kontrak ? 'error' : ''}
              />
            </div>
            {errors.nilai_kontrak && (
              <span className="error-message">{errors.nilai_kontrak}</span>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Isi Kontrak</h2>
          <div className="form-group">
            <label htmlFor="isi_kontrak">
              Deskripsi/Scope <span className="required">*</span>
            </label>
            <textarea
              id="isi_kontrak"
              name="isi_kontrak"
              value={formData.isi_kontrak}
              onChange={handleChange}
              placeholder="Jelaskan scope pekerjaan, hak dan kewajiban, dll..."
              rows={6}
              className={errors.isi_kontrak ? 'error' : ''}
            />
            {errors.isi_kontrak && (
              <span className="error-message">{errors.isi_kontrak}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="catatan">Catatan Tambahan</label>
            <textarea
              id="catatan"
              name="catatan"
              value={formData.catatan}
              onChange={handleChange}
              placeholder="Catatan atau keterangan tambahan (opsional)"
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/contracts')}>
            <X size={18} />
            Batal
          </button>
          <button type="submit" className="btn-save" disabled={loading}>
            <Save size={18} />
            {loading ? 'Menyimpan...' : 'Simpan Kontrak'}
          </button>
        </div>
      </form>

      <style>{`
        .form-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .form-header {
          margin-bottom: 2rem;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: #2d6a4f;
        }

        .form-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }

        .contract-form {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .type-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .type-option {
          position: relative;
          padding: 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .type-option input {
          position: absolute;
          opacity: 0;
        }

        .type-option:hover {
          border-color: #d1d5db;
        }

        .type-option.active {
          border-color: #2d6a4f;
          background: linear-gradient(135deg, rgba(45, 106, 79, 0.05) 0%, rgba(64, 145, 108, 0.05) 100%);
        }

        .type-icon {
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          color: #6b7280;
        }

        .type-option.active .type-icon {
          background: #2d6a4f;
          color: white;
        }

        .type-info {
          display: flex;
          flex-direction: column;
        }

        .type-label {
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 0.25rem;
        }

        .type-desc {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .required {
          color: #e74c3c;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2d6a4f;
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #e74c3c;
        }

        .form-group input.readonly {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .currency-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency-prefix {
          position: absolute;
          left: 1rem;
          color: #6b7280;
          font-weight: 600;
        }

        .currency-input input {
          padding-left: 2.5rem;
          width: 100%;
        }

        .helper-text {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .error-message {
          font-size: 0.8rem;
          color: #e74c3c;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel,
        .btn-save {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-cancel {
          background: white;
          border: 2px solid #e5e7eb;
          color: #6b7280;
        }

        .btn-cancel:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .btn-save {
          background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
          border: none;
          color: white;
        }

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
        }

        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #2d6a4f;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ContractForm;
