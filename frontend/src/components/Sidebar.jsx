import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV = [
  { to: '/',               icon: 'bi-grid-1x2-fill',        label: 'Dashboard'      },
  { to: '/accounts',       icon: 'bi-wallet2',               label: 'Accounts'       },
  { to: '/transactions',   icon: 'bi-arrow-left-right',      label: 'Transactions'   },
  { to: '/deposit',        icon: 'bi-arrow-down-circle-fill', label: 'Deposit'       },
  { to: '/withdraw',       icon: 'bi-arrow-up-circle-fill',  label: 'Withdraw'       },
  { to: '/transfer',       icon: 'bi-send-fill',             label: 'Transfer'       },
  { to: '/mini-statement', icon: 'bi-file-text-fill',        label: 'Statement'      },
  { to: '/reports',        icon: 'bi-bar-chart-fill',        label: 'Reports'        },
  { to: '/profile',        icon: 'bi-person-circle',         label: 'Profile'        },
  { to: '/security',       icon: 'bi-shield-lock-fill',      label: 'Security'       },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon"><i className="bi bi-bank2" /></span>
          <span className="sidebar__logo-text">Equi<em>Bank</em></span>
        </div>

        {/* User chip */}
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.first_name?.[0] || user?.username?.[0] || '?'}
          </div>
          <div>
            <div className="sidebar__name">{user?.first_name || user?.username}</div>
            <div className="sidebar__role">{user?.is_verified ? '✓ Verified' : 'Unverified'}</div>
          </div>
        </div>

        <div className="sidebar__divider" />

        {/* Nav */}
        <nav className="sidebar__nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={onClose}
            >
              <i className={`bi ${icon}`} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={logout}>
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}