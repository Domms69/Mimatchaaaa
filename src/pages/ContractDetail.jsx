import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Trash2, CheckCircle, XCircle,
  Truck, Building, Briefcase, Calendar, DollarSign, FileText,
  Mail, Clock, AlertTriangle
} from 'lucide-react';
import api from '../api/service';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const ContractDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    setLoading(true);
    const result = await api.getContract(id);
    setContract(result);
    setLoading(false);
  };

  const handleStatusChange = async (newStatus) => {
    await api.updateContractStatus(id, newStatus);
    loadContract();
  };

  const handleDelete = async () => {
    await api.deleteContract(id);
    navigate('/contracts');
  };

  const handlePrint = () => {
    window.print();
  };

  const getTypeIcon = (tipe) => {
    switch (tipe) {
      case 'supplier': return <Truck size={20} />;
      case 'rental': return <Building size={20} />;
      case 'employment': return <Briefcase size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getStatusBadge = (status, expiryDate) => {
    const daysLeft = getDaysLeft(expiryDate);
    
    const badges = {
      draft: { class: 'status-draft', icon: <Clock size={16} />, text: 'Draft' },
      aktif: { 
        class: daysLeft !== null && daysLeft <= 30 ? 'status-warning' : 'status-aktif', 
        icon: daysLeft !== null && daysLeft <= 30 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />, 
        text: daysLeft !== null && daysLeft <= 30 ? `Expiring in ${daysLeft} days` : 'Aktif'
      },
      berakhir: { class: 'status-berakhir', icon: <XCircle size={16} />, text: 'Berakhir' },
      batal: { class: 'status-batal', icon: <XCircle size={16} />, text: 'Batal' }
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Memuat detail kontrak...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="error-container">
        <h2>Kontrak tidak ditemukan</h2>
        <button onClick={() => navigate('/contracts')}>Kembali ke Daftar Kontrak</button>
      </div>
    );
  }

  const daysLeft = getDaysLeft(contract.masa_berlaku);

  return (
    <div className="detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/contracts')}>
          <ArrowLeft size={20} />
          <span>Kembali</span>
        </button>
        
        <div className="header-content">
          <div className="header-left">
            <h1>{contract.nomor_kontrak || 'Kontrak'}</h1>
            <div className="header-badges">
              <span className="type-badge">
                {getTypeIcon(contract.tipe_kontrak)}
                <span>{contract.tipe_kontrak || '-'}</span>
              </span>
              {getStatusBadge(contract.status, contract.masa_berlaku)}
            </div>
          </div>
          
          <div className="header-actions no-print">
            <button className="btn-icon" onClick={() => navigate(`/contracts/edit/${id}`)} title="Edit">
              <Edit size={18} />
            </button>
            <button className="btn-icon print" onClick={handlePrint} title="Print">
              <Printer size={18} />
            </button>
            <button className="btn-icon delete" onClick={() => setShowDeleteConfirm(true)} title="Delete">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Hapus Kontrak?</h3>
            <p>Kontrak {contract.nomor_kontrak} akan dihapus permanen.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Batal</button>
              <button className="btn-delete" onClick={handleDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-content">
        <div className="main-info">
          <div className="info-section">
            <h2>Informasi Kontrak</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon"><FileText size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Nomor Kontrak</span>
                  <span className="info-value">{contract.nomor_kontrak || '-'}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Calendar size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Tanggal Mulai</span>
                  <span className="info-value">{formatDate(contract.tanggal_kontrak)}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Clock size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Berlaku Hingga</span>
                  <span className="info-value">
                    {formatDate(contract.masa_berlaku)}
                    {daysLeft !== null && contract.status === 'aktif' && (
                      <span className={`days-left ${daysLeft <= 30 ? 'warning' : ''}`}>
                        ({daysLeft > 0 ? `${daysLeft} hari lagi` : 'Sudah berakhir'})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><DollarSign size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Nilai Kontrak</span>
                  <span className="info-value value">{formatRupiah(contract.nilai_kontrak)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2>Pihak Kedua</h2>
            <div className="party-card">
              <div className="party-name">{contract.nama_pihak_kedua}</div>
              {contract.email_pihak && (
                <div className="party-email">
                  <Mail size={14} />
                  <a href={`mailto:${contract.email_pihak}`}>{contract.email_pihak}</a>
                </div>
              )}
            </div>
          </div>

          <div className="info-section">
            <h2>Isi Kontrak</h2>
            <div className="content-box">
              <p>{contract.isi_kontrak || 'Tidak ada deskripsi'}</p>
            </div>
          </div>

          {contract.catatan && (
            <div className="info-section">
              <h2>Catatan</h2>
              <div className="notes-box">
                <p>{contract.catatan}</p>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-info">
          <div className="action-card">
            <h3>Status Kontrak</h3>
            <div className="current-status">
              {getStatusBadge(contract.status, contract.masa_berlaku)}
            </div>
            
            {contract.status === 'draft' && (
              <button 
                className="btn-action activate"
                onClick={() => handleStatusChange('aktif')}
              >
                <CheckCircle size={18} />
                Aktifkan Kontrak
              </button>
            )}
            
            {contract.status === 'aktif' && (
              <>
                <button 
                  className="btn-action end"
                  onClick={() => handleStatusChange('berakhir')}
                >
                  <XCircle size={18} />
                  Akhiri Kontrak
                </button>
                <button 
                  className="btn-action cancel"
                  onClick={() => handleStatusChange('batal')}
                >
                  <XCircle size={18} />
                  Batalkan
                </button>
              </>
            )}
          </div>

          <div className="meta-card">
            <h3>Metadata</h3>
            <div className="meta-item">
              <span className="meta-label">Dibuat</span>
              <span className="meta-value">{formatDateShort(contract.created_at)}</span>
            </div>
            {contract.updated_at && contract.updated_at !== contract.created_at && (
              <div className="meta-item">
                <span className="meta-label">Diupdate</span>
                <span className="meta-value">{formatDateShort(contract.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .detail-header {
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

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 0.5rem;
        }

        .header-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .status-draft {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-aktif {
          background: #d1fae5;
          color: #065f46;
        }

        .status-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .status-berakhir {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-batal {
          background: #e5e7eb;
          color: #374151;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          padding: 0.75rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .btn-icon:hover {
          border-color: #2d6a4f;
          color: #2d6a4f;
        }

        .btn-icon.print:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .btn-icon.delete:hover {
          border-color: #e74c3c;
          color: #e74c3c;
        }

        .detail-content {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }

        @media (max-width: 900px) {
          .detail-content {
            grid-template-columns: 1fr;
          }
        }

        .info-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .info-section h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          gap: 0.75rem;
        }

        .info-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, rgba(45, 106, 79, 0.1) 0%, rgba(64, 145, 108, 0.1) 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2d6a4f;
          flex-shrink: 0;
        }

        .info-content {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-weight: 600;
          color: #1a1a2e;
        }

        .info-value.value {
          color: #2d6a4f;
          font-size: 1.1rem;
        }

        .days-left {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .days-left.warning {
          color: #f59e0b;
        }

        .party-card {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
        }

        .party-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        .party-email {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
        }

        .party-email a {
          color: #2d6a4f;
          text-decoration: none;
        }

        .party-email a:hover {
          text-decoration: underline;
        }

        .content-box, .notes-box {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
          line-height: 1.7;
          color: #374151;
        }

        .notes-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
        }

        .sidebar-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .action-card, .meta-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .action-card h3, .meta-card h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .current-status {
          margin-bottom: 1rem;
        }

        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action.activate {
          background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
          color: white;
        }

        .btn-action.end {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-action.cancel {
          background: #f3f4f6;
          color: #6b7280;
        }

        .btn-action:hover {
          transform: translateY(-2px);
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .meta-item:last-child {
          border-bottom: none;
        }

        .meta-label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .meta-value {
          color: #1a1a2e;
          font-weight: 500;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 400px;
          text-align: center;
        }

        .modal-content h3 {
          margin: 0 0 0.5rem;
          color: #1a1a2e;
        }

        .modal-content p {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-cancel, .btn-delete {
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #6b7280;
        }

        .btn-delete {
          background: #e74c3c;
          color: white;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
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

        @media print {
          .no-print, .sidebar-info {
            display: none !important;
          }
          
          .detail-content {
            display: block;
          }
          
          .info-section {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractDetail;
