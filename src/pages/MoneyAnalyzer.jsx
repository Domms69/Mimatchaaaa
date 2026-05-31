import React, { useState, useRef } from 'react';
import { Upload, Camera, AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Banknote } from 'lucide-react';
import api from '../api/service';

const MoneyAnalyzer = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setError(null);
    setResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.analyzeMoney(image);
      
      if (response.success) {
        setResult(response);
      } else {
        setError(response.error || 'Gagal menganalisis gambar');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menganalisis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle size={48} />;
    
    const upperStatus = status.toUpperCase();
    if (upperStatus.includes('ASLI')) {
      return <CheckCircle size={48} className="status-icon asli" />;
    } else if (upperStatus.includes('PALSU')) {
      return <AlertTriangle size={48} className="status-icon palsu" />;
    }
    return <AlertCircle size={48} className="status-icon unknown" />;
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    const upperStatus = status.toUpperCase();
    if (upperStatus.includes('ASLI')) return 'status-asli';
    if (upperStatus.includes('PALSU')) return 'status-palsu';
    return 'status-unknown';
  };

  return (
    <div className="money-analyzer-container">
      <header className="analyzer-header">
        <h1><Banknote size={32} /> Analisis Uang</h1>
        <p>Detect keaslian uang Rupiah dengan AI</p>
      </header>

      <div className="analyzer-content">
        <div className="upload-section">
          <div 
            className={`upload-area ${image ? 'has-image' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button className="change-image-btn" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  <Camera size={16} /> Ganti Gambar
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={48} />
                <p>Klik atau drag & drop gambar uang</p>
                <span>Format: JPG, PNG, WEBP</span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div className="action-buttons">
            <button 
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={!image || analyzing}
            >
              {analyzing ? (
                <>
                  <RefreshCw size={18} className="spin" /> Menganalisis...
                </>
              ) : (
                <>
                  <Camera size={18} /> Analisis Uang
                </>
              )}
            </button>
            
            {image && (
              <button className="reset-btn" onClick={handleReset}>
                <RefreshCw size={18} /> Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            {result.analysis ? (
              <div className={`analysis-result ${getStatusClass(result.analysis.status)}`}>
                <div className="status-header">
                  {getStatusIcon(result.analysis.status)}
                  <div className="status-info">
                    <h2>{result.analysis.status}</h2>
                    {result.analysis.nominal && (
                      <span className="nominal">{result.analysis.nominal}</span>
                    )}
                  </div>
                </div>

                {result.analysis.kepercayaan !== undefined && (
                  <div className="confidence-bar">
                    <label>Tingkat Kepercayaan: {result.analysis.kepercayaan}%</label>
                    <div className="bar">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${result.analysis.kepercayaan}%` }}
                      />
                    </div>
                  </div>
                )}

                {result.analysis.ciri_ciri && (
                  <div className="ciri-ciri-section">
                    {result.analysis.ciri_ciri.positif && result.analysis.ciri_ciri.positif.length > 0 && (
                      <div className="ciri-list positif">
                        <h4><CheckCircle size={16} /> Ciri-ciri Positif</h4>
                        <ul>
                          {result.analysis.ciri_ciri.positif.map((ciri, idx) => (
                            <li key={idx}>{ciri}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.analysis.ciri_ciri.negatif && result.analysis.ciri_ciri.negatif.length > 0 && (
                      <div className="ciri-list negatif">
                        <h4><AlertTriangle size={16} /> Ciri-ciri Negatif</h4>
                        <ul>
                          {result.analysis.ciri_ciri.negatif.map((ciri, idx) => (
                            <li key={idx}>{ciri}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {result.analysis.rekomendasi && (
                  <div className="rekomendasi">
                    <h4>Rekomendasi</h4>
                    <p>{result.analysis.rekomendasi}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="raw-result">
                <h4>Hasil Analisis</h4>
                <pre>{result.raw}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyAnalyzer;
