import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Card, { CardHeader } from '../components/Card';
import Button from '../components/Button';
import TransactionRow from '../components/TransactionRow';
import './Dashboard.css';

const fmt = (n) =>
  'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dash-loading">
      <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem', color: 'var(--green)' }} />
    </div>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard fade-up">
      {/* Greeting */}
      <div className="dash-greet">
        <div>
          <p className="dash-greet__sub">{greeting()},</p>
          <h2 className="dash-greet__name">{user?.first_name || user?.username} 👋</h2>
        </div>
        {data?.unread_notifications > 0 && (
          <div className="dash-greet__notif">
            <i className="bi bi-bell-fill text-green" />
            <span>{data.unread_notifications} unread notification{data.unread_notifications > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Hero balance */}
      <div className="dash-hero">
        <div className="dash-hero__label">Total Balance</div>
        <div className="dash-hero__amount">{fmt(data?.total_balance || 0)}</div>
        <div className="dash-hero__sub">{data?.accounts?.length || 0} account{data?.accounts?.length !== 1 ? 's' : ''}</div>
        <div className="dash-hero__glow" />
      </div>

      {/* Quick actions */}
      <div className="dash-actions">
        {[
          { to: '/deposit',  icon: 'bi-arrow-down-circle-fill',  label: 'Deposit',  color: 'var(--green)' },
          { to: '/withdraw', icon: 'bi-arrow-up-circle-fill',    label: 'Withdraw', color: 'var(--red)' },
          { to: '/transfer', icon: 'bi-send-fill',               label: 'Transfer', color: 'var(--yellow)' },
          { to: '/transactions', icon: 'bi-clock-history',       label: 'History',  color: 'var(--muted)' },
        ].map(({ to, icon, label, color }) => (
          <Link key={to} to={to} className="dash-action-btn">
            <span className="dash-action-btn__icon" style={{ color }}>
              <i className={`bi ${icon}`} />
            </span>
            <span className="dash-action-btn__label">{label}</span>
          </Link>
        ))}
      </div>

      {/* Accounts + Recent Txns */}
      <div className="dash-grid">
        {/* Accounts */}
        <Card>
          <CardHeader
            title="My Accounts"
            action={<Link to="/accounts"><Button variant="ghost" size="sm" icon="bi-arrow-right">View all</Button></Link>}
          />
          <div className="dash-accounts">
            {data?.accounts?.map(acc => (
              <div key={acc.id} className="dash-account">
                <div className="dash-account__left">
                  <span className="dash-account__icon">
                    <i className={`bi ${
                      acc.account_type === 'SAVINGS' ? 'bi-piggy-bank' :
                      acc.account_type === 'CURRENT' ? 'bi-briefcase' :
                      'bi-safe'
                    }`} />
                  </span>
                  <div>
                    <div className="dash-account__type">{acc.account_type}</div>
                    <div className="dash-account__num">{acc.account_number}</div>
                  </div>
                </div>
                <div className="dash-account__right">
                  <div className="dash-account__bal">{fmt(acc.balance)}</div>
                  <span className={`badge badge-${acc.status === 'ACTIVE' ? 'green' : 'red'}`}>
                    {acc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader
            title="Recent Transactions"
            action={<Link to="/transactions"><Button variant="ghost" size="sm" icon="bi-arrow-right">View all</Button></Link>}
          />
          {data?.recent_transactions?.length === 0 && (
            <div className="dash-empty">
              <i className="bi bi-inbox" />
              <span>No transactions yet</span>
            </div>
          )}
          <div className="dash-txn-list">
            {data?.recent_transactions?.map(txn => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}