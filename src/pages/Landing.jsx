import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, CheckCircle, Star, LogIn, Leaf, Coffee, Check, MapPin, Clock } from 'lucide-react';
import api from '../api/service';

const Landing = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('mimatcha_user');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState([
    { id: 1, name: 'Ayu Putri', rating: 5, comment: 'Matcha-nya enak banget! Creamy dan tidak pahit. Recommended! 🍵', date: '2 hari lalu' },
    { id: 2, name: 'Bambang S.', rating: 4, comment: 'Minuman kreatif dengan rasa matcha yang autentik. Harganya juga terjangkau.', date: '5 hari lalu' },
    { id: 3, name: 'Citra Dewi', rating: 5, comment: 'Pelayanan ramah, tempat nyaman, dan matcha latte-nya jadi favoritku!', date: '1 minggu lalu' },
  ]);

  const handleSubmitReview = () => {
    if (!rating || !reviewerName.trim() || !reviewComment.trim()) return;
    const newReview = {
      id: Date.now(),
      name: reviewerName.trim(),
      rating,
      comment: reviewComment.trim(),
      date: 'Baru saja',
    };
    setReviews([newReview, ...reviews]);
    setRating(0);
    setReviewerName('');
    setReviewComment('');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await api.getProducts();
        if (result && Array.isArray(result)) {
          setProducts(result);
        } else if (result?.data && Array.isArray(result.data)) {
          setProducts(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatRupiah = (angka) => {
    if (angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-container">
          <div className="landing-nav-inner">
            <div className="landing-logo">
              <img src="/LogoM.jpeg" alt="MiMatcha" className="landing-logo-img" />
              <span className="landing-logo-text">MiMatcha</span>
            </div>
            <div className="landing-nav-links">
              <a href="#products" className="nav-link">Produk</a>
              <a href="#features" className="nav-link">Fitur</a>
              <a href="#about" className="nav-link">Tentang</a>
              {isLoggedIn ? (
                <Link to="/dashboard" className="landing-btn-primary">
                  Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/login" className="landing-btn-primary">
                  Masuk <ArrowRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Selamat Datang di <span className="text-primary">MiMatcha</span>
              </h1>
              <p className="hero-subtitle">
                Solusi manajemen bisnis lengkap untuk toko dan kafe matcha.
                Kelola produk, proses pesanan, dan kembangkan bisnis Anda dengan mudah.
              </p>
              <div className="hero-actions">
                {!isLoggedIn && (
                  <Link to="/login" className="landing-btn-primary hero-cta">
                    Mulai Sekarang <ArrowRight size={20} />
                  </Link>
                )}
                <a href="#products" className="landing-btn-secondary">
                  Lihat Produk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="landing-section landing-products">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-badge">Menu Kami</span>
            <h2 className="section-title">Jelajahi Produk Kami</h2>
            <p className="section-desc">
              Jelajahi minuman dan camilan matcha pilihan kami
            </p>
          </div>
          {loading ? (
            <div className="products-loading">
              <div className="loading-spinner"></div>
              <p>Memuat menu...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-loading">
              <p>Belum ada produk tersedia. Nantikan segera!</p>
            </div>
          ) : (
            <>
              <div className="products-preview-grid">
                {products.map((p) => (
                  <div key={p.id_produk} className="product-preview-card">
                    <div className="preview-img-placeholder">
                      {p.gambar ? (
                        <img src={p.gambar} alt={p.nama_produk} className="product-card-img" />
                      ) : (
                        <span className="preview-emoji">🍵</span>
                      )}
                    </div>
                    <div className="preview-info">
                      {p.kategori && <span className="product-category">{p.kategori}</span>}
                      <h4>{p.nama_produk}</h4>
                      <p>{p.deskripsi || p.kategori || 'Minuman matcha premium'}</p>
                      <span className="preview-price">{formatRupiah(p.harga)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {!isLoggedIn && (
                <div className="login-to-order">
                  <div className="login-to-order-content">
                    <h3>Siap Memesan?</h3>
                    <p>Masuk untuk mengakses menu lengkap dan melakukan pemesanan langsung dari sistem POS kami</p>
                    <Link to="/login" className="landing-btn-primary login-order-btn">
                      <LogIn size={18} /> Masuk untuk Memesan
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-section landing-features">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-badge">Fitur</span>
            <h2 className="section-title">Semua yang Anda Butuhkan</h2>
            <p className="section-desc">
              Alat lengkap untuk mengelola bisnis matcha Anda
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <ShoppingBag size={28} />
              </div>
              <h3>Sistem POS</h3>
              <p>Sistem point of sale yang cepat dan intuitif untuk transaksi sehari-hari</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle size={28} />
              </div>
              <h3>Manajemen Stok</h3>
              <p>Pantau tingkat stok, dapatkan peringatan stok menipis, dan kelola pasokan</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Star size={28} />
              </div>
              <h3>Analisis Penjualan</h3>
              <p>Laporan dan analisis komprehensif untuk mengembangkan bisnis Anda</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tentang MiMatcha Section */}
      <section id="about" className="landing-section landing-about">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-badge">Tentang Kami</span>
            <h2 className="section-title">Tentang MiMatcha</h2>
            <p className="section-desc">
              Solusi manajemen bisnis terpercaya untuk toko dan kafe matcha
            </p>
          </div>
          <div className="about-grid">
            <div className="about-image">
              <div className="about-image-card">
                <div className="about-image-icon">MM</div>
                <h3>MiMatcha</h3>
                <p>Sejak 2024</p>
              </div>
            </div>
            <div className="about-text">
              <h3>Platform Manajemen Bisnis Matcha Terlengkap</h3>
              <p>
                MiMatcha adalah sistem manajemen bisnis yang dirancang khusus untuk toko dan kafe matcha.
                Kami menggabungkan kecintaan terhadap matcha premium dengan teknologi modern untuk membantu
                pengusaha matcha mengelola bisnis mereka dengan lebih efisien.
              </p>
              <p>
                Visi kami adalah memberdayakan setiap pelaku bisnis matcha — dari pemilik kafe kecil hingga 
                jaringan toko yang lebih besar — dengan alat yang mudah digunakan untuk mengelola produk,
                memproses pesanan, memantau stok, dan mengembangkan usaha mereka secara berkelanjutan.
              </p>
              <div className="about-highlights">
                <div className="about-highlight-item">
                  <div className="about-highlight-icon"><Leaf size={18} /></div>
                  <span>Fokus pada Matcha</span>
                </div>
                <div className="about-highlight-item">
                  <div className="about-highlight-icon"><Check size={18} /></div>
                  <span>Mudah Digunakan</span>
                </div>
                <div className="about-highlight-item">
                  <div className="about-highlight-icon"><Coffee size={18} /></div>
                  <span>Untuk Kafe & Toko</span>
                </div>
                <div className="about-highlight-item">
                  <div className="about-highlight-icon"><Star size={18} /></div>
                  <span>Terpercaya</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="landing-section landing-reviews">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-badge">Ulasan Pelanggan</span>
            <h2 className="section-title">Berikan Penilaian Anda</h2>
            <p className="section-desc">
              Bagikan pengalaman Anda menikmati minuman MiMatcha
            </p>
          </div>
          <div className="reviews-layout">
            <div className="review-form-card">
              <h3 className="review-form-title">Tulis Ulasan</h3>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${(hoverRating || rating) >= star ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      size={32}
                      className={((hoverRating || rating) >= star) ? 'star-filled' : 'star-empty'}
                    />
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="review-input"
                placeholder="Nama Anda"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
              />
              <textarea
                className="review-textarea"
                placeholder="Tulis ulasan Anda tentang minuman MiMatcha..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <button
                className="review-submit-btn"
                onClick={handleSubmitReview}
                disabled={!rating || !reviewerName.trim() || !reviewComment.trim()}
              >
                Kirim Ulasan
              </button>
            </div>
            <div className="review-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <div className="review-avatar">{review.name.charAt(0)}</div>
                    <div className="review-meta">
                      <div className="review-name">{review.name}</div>
                      <div className="review-date">{review.date}</div>
                    </div>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= review.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="review-comment">{review.comment}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo-row">
                <img src="/LogoM.jpeg" alt="MiMatcha" className="footer-logo-img" />
                <span className="landing-logo-text" style={{ fontSize: '1.2rem' }}>MiMatcha</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Sistem Manajemen Bisnis
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Produk</h4>
                <a href="#products">Menu</a>
                <a href="#features">Fitur</a>
                <a href="#about">Tentang</a>
              </div>
              <div className="footer-col">
                <h4>Perusahaan</h4>
                <a href="#about">Tentang Kami</a>
                <a href="#contact">Kontak</a>
                <a href="#careers">Karir</a>
              </div>
              <div className="footer-col">
                <h4>Bantuan</h4>
                <a href="#help">Pusat Bantuan</a>
                <a href="#privacy">Privasi</a>
                <a href="#terms">Ketentuan</a>
              </div>
            </div>
          </div>
          <div className="footer-order-online">
            <span className="footer-order-label">Pesan Online via WhatsApp</span>
            <a href="https://wa.me/6285189920674" target="_blank" rel="noopener noreferrer" className="footer-order-phone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '6px'}}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              0851-8992-0674
            </a>
          </div>
          
          {/* Address */}
          <div className="footer-address">
            <div className="footer-address-info">
              <MapPin size={20} className="footer-address-icon" />
              <div className="footer-address-text">
                <span className="footer-address-label">Lokasi Kami</span>
                <span>Jl. Rajamandala, Kec. Cipatat, Kab. Bandung Barat, Jawa Barat 40554</span>
              </div>
              <a 
                href="https://maps.app.goo.gl/iiuVmbwemrGr4HRn7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-map-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '4px'}}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Buka di Google Maps
              </a>
            </div>
            <div className="footer-map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5000!2d107.3516439!3d-6.8328067!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDknNTguMSJTIDEwN8KwMjEnMDUuOSJF!5e0!3m2!1sid!2sid!4v1"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi MiMatcha"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="footer-hours">
            <div className="footer-hours-inner">
              <div className="footer-hours-header">
                <Clock size={20} className="footer-hours-icon" />
                <span className="footer-hours-label">Jam Operasional</span>
              </div>
              <div className="footer-hours-grid">
                <div className="footer-hours-item">
                  <span className="footer-hours-day">Selasa - Jumat</span>
                  <span className="footer-hours-time">13.00 - 21.00</span>
                </div>
                <div className="footer-hours-item">
                  <span className="footer-hours-day">Sabtu - Minggu</span>
                  <span className="footer-hours-time">13.00 - 21.00</span>
                </div>
                <div className="footer-hours-item footer-hours-item-closed">
                  <span className="footer-hours-day">Senin</span>
                  <span className="footer-hours-time footer-hours-closed">Libur</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 MiMatcha. Hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
