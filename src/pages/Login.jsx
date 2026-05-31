import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/background.png';
import api from '../api/service';

const accounts = {
  owner: { email: 'owner@mimatcha.id', password: 'owner123', role: 'owner', name: 'Admin Owner' },
  kasir: { email: 'kasir@mimatcha.id', password: 'kasir123', role: 'kasir', name: 'Kasir Staff' }
};

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await api.login(email, password);
      
      if (result.success) {
        localStorage.setItem('mimatcha_user', JSON.stringify(result.user));
        localStorage.setItem('mimatcha_role', result.user.role);
        
        if (result.user.role === 'owner') {
          navigate('/dashboard');
        } else {
          navigate('/pos');
        }
      } else {
        setError('Email atau password salah!');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Pastikan server PHP berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (type) => {
    setEmail(accounts[type].email);
    setPassword(accounts[type].password);
    setError('');
  };

  return (
    <div className="login-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-wrapper">
            <div className="logo-icon">SP</div>
            <span className="brand-name">MIMATCHA</span>
          </div>
        </div>

        <div className="header-text">
          <h2>Selamat Datang</h2>
          <p>
            Masuk ke sistem untuk mengelola bisnis Anda 
            dengan mudah dan profesional.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ingat Saya</span>
            </label>
            <a href="#" className="forgot-link">Lupa Password?</a>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Masuk ke Sistem'} <ArrowRight size={20} />
          </button>
          
          {error && (
            <div className="login-error" style={{
              background: '#fee',
              color: '#c00',
              padding: '0.75rem',
              borderRadius: '8px',
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
        </form>

        <div className="divider">
          <span>Demo Akun</span>
        </div>

        <div className="demo-login-buttons">
          <button 
            type="button" 
            className="demo-btn-owner"
            onClick={() => fillDemo('owner')}
          >
            <Crown size={18} />
            Login sebagai Owner
          </button>
          <button 
            type="button" 
            className="demo-btn-kasir"
            onClick={() => fillDemo('kasir')}
          >
            <User size={18} />
            Login sebagai Kasir
          </button>
        </div>
      </div>

      <style>{`
        .demo-login-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .demo-btn-owner, .demo-btn-kasir {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }
        .demo-btn-owner {
          background: linear-gradient(135deg, #4c632d, #6b8e23);
          color: white;
          border: none;
        }
        .demo-btn-owner:hover {
          background: linear-gradient(135deg, #3d4f24, #5a7520);
          transform: translateY(-2px);
        }
        .demo-btn-kasir {
          background: white;
          color: #4c632d;
          border: 2px solid #4c632d;
        }
        .demo-btn-kasir:hover {
          background: rgba(76, 99, 45, 0.1);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default Login;