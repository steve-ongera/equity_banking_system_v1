import { useEffect, useState } from 'react';
import { getTransactions, getAccounts } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import TransactionRow from '../components/TransactionRow';
import './MiniStatement.css';

const toArray = (data) =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.accounts ?? [];

const fmt = (n) => 'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

export default function MiniStatement() {
  const [accounts, setAccounts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAcc, setSelectedAcc]   = useState('');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    getAccounts().then(r => {
      const list = toArray(r.data);
      setAccounts(list);
      if (list.length) setSelectedAcc(list[0].account_number);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAcc) return;
    setLoading(true);
    getTransactions({ account: selectedAcc })
      .then(r => setTransactions(toArray(r.data)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAcc]);

  const account = accounts.find(a => a.account_number === selectedAcc);

  const debits  = transactions.filter(t => ['WITHDRAWAL','TRANSFER','FEE'].includes(t.transaction_type))
                               .reduce((s, t) => s + Number(t.amount), 0);
  const credits = transactions.filter(t => t.transaction_type === 'DEPOSIT')
                               .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="mini-page fade-up">

      {/* Account selector */}
      <div className="mini-tabs">
        {accounts.map(acc => (
          <button
            key={acc.id}
            className={`mini-tab ${selectedAcc === acc.account_number ? 'mini-tab--active' : ''}`}
            onClick={() => setSelectedAcc(acc.account_number)}
          >
            <i className={`bi ${
              acc.account_type === 'SAVINGS' ? 'bi-piggy-bank' :
              acc.account_type === 'CURRENT' ? 'bi-briefcase' : 'bi-safe'
            }`} />
            <span>{acc.account_type}</span>
          </button>
        ))}
      </div>

      {/* Account snapshot */}
      {account && (
        <Card className="mini-snapshot">
          <div className="mini-snapshot__top">
            <div>
              <div className="mini-snapshot__label">Account Number</div>
              <div className="mini-snapshot__num">{account.account_number}</div>
            </div>
            <span className={`badge badge-${account.status === 'ACTIVE' ? 'green' : 'red'}`}>
              {account.status}
            </span>
          </div>
          <div className="mini-snapshot__balance">{fmt(account.balance)}</div>
          <div className="mini-snapshot__label">Current Balance</div>
          <div className="mini-snapshot__flow">
            <div className="mini-snapshot__flow-item">
              <i className="bi bi-arrow-down-circle-fill" style={{ color:'var(--green)' }} />
              <div>
                <div className="mini-snapshot__flow-label">Total Credits</div>
                <div className="mini-snapshot__flow-val" style={{ color:'var(--green)' }}>{fmt(credits)}</div>
              </div>
            </div>
            <div className="mini-snapshot__flow-item">
              <i className="bi bi-arrow-up-circle-fill" style={{ color:'var(--red)' }} />
              <div>
                <div className="mini-snapshot__flow-label">Total Debits</div>
                <div className="mini-snapshot__flow-val" style={{ color:'var(--red)' }}>{fmt(debits)}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Statement list */}
      <Card>
        <CardHeader
          title="Mini Statement"
          subtitle={`Last ${transactions.length} transactions`}
        />
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}>
            <i className="bi bi-arrow-repeat spin" style={{ fontSize:'1.8rem', color:'var(--green)' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize:'2.5rem', display:'block', marginBottom:'10px' }} />
            No transactions for this account.
          </div>
        ) : (
          <div className="dash-txn-list">
            {transactions.map(txn => <TransactionRow key={txn.id} txn={txn} />)}
          </div>
        )}
      </Card>
    </div>
  );
}