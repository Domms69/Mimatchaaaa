import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Crown, Warehouse, BadgeDollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/background.png';
import api from '../api/service';

// Route mapping based on role (sama dengan App.jsx)
const ROLE_DEFAULT_ROUTES = {
  owner: '/dashboard',
  kasir: '/pos',
  staff_gudang: '/inventory',
  admin_keuangan: '/dashboard',
  user: '/'
};

const accounts = {
  owner: { email: 'owner@mimatcha.id', password: 'owner123', role: 'owner', name: 'Admin Owner' },
  kasir: { email: 'kasir@mimatcha.id', password: 'kasir123', role: 'kasir', name: 'Kasir Staff' },
  staff_gudang: { email: 'gudang@mimatcha.id', password: 'gudang123', role: 'staff_gudang', name: 'Staff Gudang' },
  admin_keuangan: { email: 'keuangan@mimatcha.id', password: 'keuangan123', role: 'admin_keuangan', name: 'Admin Keuangan' }
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
        
        // Redirect berdasarkan role
        const defaultRoute = ROLE_DEFAULT_ROUTES[result.user.role] || '/pos';
        navigate(defaultRoute);
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
            <img src="/LogoM.jpeg" alt="MiMatcha" className="login-logo-img" />
            <span className="brand-name">MIMATCHA</span>
          </div>
          <p className="logo-tagline">Business Management System</p>
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
            <div className="login-error">
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
            className="demo-btn demo-btn-owner"
            onClick={() => fillDemo('owner')}
          >
            <Crown size={18} />
            Login sebagai Owner
          </button>
          <button 
            type="button" 
            className="demo-btn demo-btn-kasir"
            onClick={() => fillDemo('kasir')}
          >
            <User size={18} />
            Login sebagai Kasir
          </button>
          <button 
            type="button" 
            className="demo-btn demo-btn-gudang"
            onClick={() => fillDemo('staff_gudang')}
          >
            <Warehouse size={18} />
            Login sebagai Staff Gudang
          </button>
          <button 
            type="button" 
            className="demo-btn demo-btn-keuangan"
            onClick={() => fillDemo('admin_keuangan')}
          >
            <BadgeDollarSign size={18} />
            Login sebagai Admin Keuangan
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;