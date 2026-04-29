import { useEffect, useState } from 'react';
import { getTransactions, getAccounts } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import TransactionRow from '../components/TransactionRow';
import './Reports.css';

const toArray = (data) =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.accounts ?? [];

const fmt = (n) => 'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

const TYPE_COLORS = {
  DEPOSIT:    'var(--green)',
  WITHDRAWAL: 'var(--red)',
  TRANSFER:   'var(--yellow)',
  FEE:        'var(--muted)',
};

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState({ type: '', account: '' });

  useEffect(() => {
    Promise.all([getTransactions(), getAccounts()])
      .then(([txnRes, accRes]) => {
        setTransactions(toArray(txnRes.data));
        setAccounts(toArray(accRes.data));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(t => {
    if (filters.type    && t.transaction_type !== filters.type)    return false;
    if (filters.account && t.account_number   !== filters.account) return false;
    return true;
  });

  // Summary stats
  const totalIn  = filtered.filter(t => t.transaction_type === 'DEPOSIT')
                            .reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filtered.filter(t => ['WITHDRAWAL','TRANSFER'].includes(t.transaction_type))
                            .reduce((s, t) => s + Number(t.amount), 0);
  const totalFees = filtered.reduce((s, t) => s + Number(t.fee), 0);

  // Breakdown by type
  const breakdown = ['DEPOSIT','WITHDRAWAL','TRANSFER','FEE'].map(type => ({
    type,
    count:  filtered.filter(t => t.transaction_type === type).length,
    volume: filtered.filter(t => t.transaction_type === type)
                    .reduce((s, t) => s + Number(t.amount), 0),
  }));

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', paddingTop:'60px' }}>
      <i className="bi bi-arrow-repeat spin" style={{ fontSize:'2rem', color:'var(--green)' }} />
    </div>
  );

  return (
    <div className="reports-page fade-up">

      {/* Summary cards */}
      <div className="reports-summary">
        {[
          { label: 'Total Money In',  value: fmt(totalIn),   icon: 'bi-arrow-down-circle-fill',  color: 'var(--green)'  },
          { label: 'Total Money Out', value: fmt(totalOut),  icon: 'bi-arrow-up-circle-fill',    color: 'var(--red)'    },
          { label: 'Total Fees Paid', value: fmt(totalFees), icon: 'bi-receipt',                 color: 'var(--yellow)' },
          { label: 'Transactions',    value: filtered.length, icon: 'bi-list-check',             color: 'var(--muted)'  },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} className="reports-stat">
            <span className="reports-stat__icon" style={{ color }}><i className={`bi ${icon}`} /></span>
            <div className="reports-stat__val">{value}</div>
            <div className="reports-stat__label">{label}</div>
          </Card>
        ))}
      </div>

      {/* Breakdown by type */}
      <Card style={{ marginBottom: '20px' }}>
        <CardHeader title="Transaction Breakdown" subtitle="Volume by transaction type" />
        <div className="reports-breakdown">
          {breakdown.map(({ type, count, volume }) => (
            <div key={type} className="reports-breakdown__row">
              <span className="reports-breakdown__type" style={{ color: TYPE_COLORS[type] }}>
                <i className={`bi ${
                  type === 'DEPOSIT' ? 'bi-arrow-down-circle' :
                  type === 'WITHDRAWAL' ? 'bi-arrow-up-circle' :
                  type === 'TRANSFER' ? 'bi-send' : 'bi-receipt'
                }`} /> {type}
              </span>
              <span className="reports-breakdown__count">{count} txn{count !== 1 ? 's' : ''}</span>
              <div className="reports-breakdown__bar-wrap">
                <div
                  className="reports-breakdown__bar"
                  style={{
                    width: filtered.length ? `${(count / filtered.length) * 100}%` : '0%',
                    background: TYPE_COLORS[type],
                  }}
                />
              </div>
              <span className="reports-breakdown__vol">{fmt(volume)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters + transaction list */}
      <Card>
        <CardHeader title="Transaction Log" subtitle="Filter and browse all transactions" />
        <div className="reports-filters">
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="reports-select"
          >
            <option value="">All Types</option>
            {['DEPOSIT','WITHDRAWAL','TRANSFER','FEE','REVERSAL'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filters.account}
            onChange={e => setFilters(f => ({ ...f, account: e.target.value }))}
            className="reports-select"
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.account_number}>
                {a.account_type} — {a.account_number}
              </option>
            ))}
          </select>
          {(filters.type || filters.account) && (
            <button
              className="reports-clear"
              onClick={() => setFilters({ type: '', account: '' })}
            >
              <i className="bi bi-x-circle" /> Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize:'2.5rem', display:'block', marginBottom:'10px' }} />
            No transactions match your filters.
          </div>
        ) : (
          <div className="dash-txn-list">
            {filtered.map(txn => <TransactionRow key={txn.id} txn={txn} />)}
          </div>
        )}
      </Card>
    </div>
  );
}