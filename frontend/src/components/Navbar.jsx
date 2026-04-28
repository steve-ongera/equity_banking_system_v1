import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getNotifications, markAllRead, markRead } from '../utils/api';
import './Navbar.css';

const PAGE_TITLES = {
  '/':             'Dashboard',
  '/accounts':     'Accounts',
  '/transactions': 'Transactions',
  '/deposit':      'Deposit Funds',
  '/withdraw':     'Withdraw Funds',
  '/transfer':     'Transfer Funds',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const [notifs, setNotifs]     = useState([]);
  const [open, setOpen]         = useState(false);
  const [unread, setUnread]     = useState(0);
  const dropRef                 = useRef(null);
  const title = PAGE_TITLES[location.pathname] || 'EquiBank';

  useEffect(() => { fetchNotifs(); }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchNotifs() {
    try {
      const { data } = await getNotifications();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifs(list);
      setUnread(list.filter(n => !n.is_read).length);
    } catch {}
  }

  async function handleMarkAll() {
    try {
      await markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  }

  async function handleMarkOne(id) {
    try {
      await markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  }

  const ntypeIcon = (t) => ({
    TRANSACTION: 'bi-arrow-left-right',
    SECURITY:    'bi-shield-check',
    PROMO:       'bi-gift',
    SYSTEM:      'bi-info-circle',
  }[t] || 'bi-bell');

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__menu-btn" onClick={onMenuClick} aria-label="Menu">
          <i className="bi bi-list" />
        </button>
        <div className="navbar__title">
          <span className="navbar__title-text">{title}</span>
        </div>
      </div>

      <div className="navbar__right">
        <div className="navbar__notif-wrap" ref={dropRef}>
          <button
            className={"navbar__icon-btn" + (open ? " navbar__icon-btn--active" : "")}
            onClick={() => setOpen(v => !v)}
            aria-label="Notifications"
          >
            <i className="bi bi-bell" />
            {unread > 0 && <span className="navbar__badge">{unread > 9 ? '9+' : unread}</span>}
          </button>

          {open && (
            <div className="notif-drop">
              <div className="notif-drop__header">
                <span>Notifications</span>
                {unread > 0 && (
                  <button className="notif-drop__mark-all" onClick={handleMarkAll}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-drop__list">
                {notifs.length === 0 ? (
                  <div className="notif-drop__empty">
                    <i className="bi bi-bell-slash" />
                    <span>No notifications</span>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={"notif-item" + (!n.is_read ? " notif-item--unread" : "")}
                      onClick={() => !n.is_read && handleMarkOne(n.id)}
                    >
                      <span className="notif-item__icon">
                        <i className={"bi " + ntypeIcon(n.ntype)} />
                      </span>
                      <div className="notif-item__body">
                        <div className="notif-item__title">{n.title}</div>
                        <div className="notif-item__msg">{n.message}</div>
                        <div className="notif-item__time">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {!n.is_read && <span className="notif-item__dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}