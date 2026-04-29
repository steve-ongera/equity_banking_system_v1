import { useEffect, useState } from 'react';
import { getTransactions } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import TransactionRow from '../components/TransactionRow';
import './Transactions.css';

const TYPES = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'REVERSAL'];

export default function Transactions() {
  const [txns, setTxns]       = useState([]);
  const [filter, setFilter]   = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'ALL' ? { type: filter } : {};
    getTransactions(params)
      .then(r => setTxns(r.data?.results ?? r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="txns-page fade-up">
      <Card>
        <CardHeader title="Transaction History" subtitle="Your last 50 transactions" />

        {/* Filter pills */}
        <div className="txns-filters">
          {TYPES.map(t => (
            <button
              key={t}
              className={`txns-filter-pill ${filter === t ? 'txns-filter-pill--active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="txns-loading">
            <i className="bi bi-arrow-repeat spin" style={{ fontSize:'1.8rem', color:'var(--green)' }} />
          </div>
        ) : txns.length === 0 ? (
          <div className="txns-empty">
            <i className="bi bi-inbox" />
            <span>No transactions found</span>
          </div>
        ) : (
          <div className="txns-list">
            {txns.map(txn => <TransactionRow key={txn.id} txn={txn} />)}
          </div>
        )}
      </Card>
    </div>
  );
}