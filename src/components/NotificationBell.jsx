import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, AlertCircle, Activity, CreditCard, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NOTIF_ICONS = {
  order: <ShoppingBag size={14} />,
  stock: <AlertCircle size={14} />,
  contract: <AlertCircle size={14} />,
  payment: <CreditCard size={14} />,
  system: <Info size={14} />,
};

const NOTIF_TYPES = {
  order: 'order',
  stock: 'alert',
  contract: 'warning',
  payment: 'report',
  system: 'report',
};

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru Saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const NotificationBell = ({ inSidebar = false }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Refresh on open
  const handleToggle = () => {
    const next = !showDropdown;
    if (next) refresh();
    setShowDropdown(next);
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id);
    setShowDropdown(false);
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    setShowDropdown(false);
  };

  return (
    <div className="notification-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        className={inSidebar ? 'notif-btn' : 'notification-btn'}
        onClick={handleToggle}
        title="Notifikasi"
      >
        <Bell size={inSidebar ? 20 : 18} />
        {unreadCount > 0 && (
          <span className={inSidebar ? 'notif-badge' : 'badge-notif'}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-menu notification-dropdown" style={{ right: 0, top: '100%' }}>
          <div className="dropdown-header">
            <span>Notifikasi</span>
            <button className="mark-read" onClick={handleMarkAllRead}>
              Tandai sudah dibaca
            </button>
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className="notif-item"
                  onClick={() => handleNotifClick(n)}
                  style={{ opacity: n.is_read ? 0.6 : 1 }}
                >
                  <div className={`notif-icon ${NOTIF_TYPES[n.type] || 'report'}`}>
                    {NOTIF_ICONS[n.type] || <Info size={14} />}
                  </div>
                  <div className="notif-info">
                    <p className="notif-text">
                      <strong>{n.title}</strong>
                      <br />
                      {n.message}
                    </p>
                    <span className="notif-time">{formatTime(n.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="notif-empty">
                <Bell size={24} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                <p>Tidak ada notifikasi baru</p>
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <button onClick={handleViewAll}>Lihat semua aktivitas</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
