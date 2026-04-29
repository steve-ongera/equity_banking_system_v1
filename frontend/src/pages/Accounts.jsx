import { useEffect, useState } from 'react';
import { getAccounts } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import './Accounts.css';

const fmt = (n) =>
  'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

const TYPE_ICON = {
  SAVINGS: 'bi-piggy-bank',
  CURRENT: 'bi-briefcase',
  FIXED:   'bi-safe',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getAccounts()
      .then(r => setAccounts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', paddingTop:'60px' }}>
      <i className="bi bi-arrow-repeat spin" style={{ fontSize:'2rem', color:'var(--green)' }} />
    </div>
  );

  return (
    <div className="accounts-page fade-up">
      <div className="accounts-grid">
        {accounts.map((acc, i) => (
          <Card key={acc.id} style={{ animationDelay: `${i * 80}ms` }} className="account-card fade-up">
            <div className="account-card__top">
              <span className="account-card__icon">
                <i className={`bi ${TYPE_ICON[acc.account_type] || 'bi-bank'}`} />
              </span>
              <span className={`badge badge-${acc.status === 'ACTIVE' ? 'green' : 'red'}`}>
                {acc.status}
              </span>
            </div>

            <div className="account-card__type">{acc.account_type} Account</div>
            <div className="account-card__number">{acc.account_number}</div>

            <div className="account-card__divider" />

            <div className="account-card__balance-label">Available Balance</div>
            <div className="account-card__balance">{fmt(acc.balance)}</div>

            <div className="account-card__meta">
              <div className="account-card__meta-item">
                <span className="account-card__meta-label">Currency</span>
                <span className="account-card__meta-val">{acc.currency}</span>
              </div>
              <div className="account-card__meta-item">
                <span className="account-card__meta-label">Min Balance</span>
                <span className="account-card__meta-val">{fmt(acc.minimum_balance)}</span>
              </div>
              <div className="account-card__meta-item">
                <span className="account-card__meta-label">Opened</span>
                <span className="account-card__meta-val">
                  {new Date(acc.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card>
          <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>
            <i className="bi bi-wallet2" style={{ fontSize:'3rem', display:'block', marginBottom:'12px' }} />
            No accounts found.
          </div>
        </Card>
      )}
    </div>
  );
}