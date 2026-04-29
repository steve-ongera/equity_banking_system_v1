import './TransactionRow.css';

const ICONS = {
  DEPOSIT:    { icon: 'bi-arrow-down-circle-fill', color: 'var(--green)',  bg: 'var(--green-dim)' },
  WITHDRAWAL: { icon: 'bi-arrow-up-circle-fill',   color: 'var(--red)',    bg: 'var(--red-dim)' },
  TRANSFER:   { icon: 'bi-send-fill',              color: 'var(--yellow)', bg: '#FFD60022' },
  FEE:        { icon: 'bi-dash-circle-fill',        color: 'var(--muted)', bg: '#6B8F7122' },
  REVERSAL:   { icon: 'bi-arrow-counterclockwise', color: 'var(--muted)', bg: '#6B8F7122' },
};

const fmt = (n) =>
  'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });

export default function TransactionRow({ txn }) {
  const meta = ICONS[txn.transaction_type] || ICONS.FEE;
  const isCredit = txn.transaction_type === 'DEPOSIT' ||
    (txn.transaction_type === 'TRANSFER' && txn.balance_after > txn.balance_before);

  return (
    <div className="txn-row">
      <span className="txn-row__icon" style={{ color: meta.color, background: meta.bg }}>
        <i className={`bi ${meta.icon}`} />
      </span>
      <div className="txn-row__body">
        <div className="txn-row__desc">{txn.description || txn.transaction_type}</div>
        <div className="txn-row__ref">{txn.reference} · {new Date(txn.created_at).toLocaleDateString()}</div>
      </div>
      <div className="txn-row__right">
        <div className="txn-row__amount" style={{ color: isCredit ? 'var(--green)' : 'var(--red)' }}>
          {isCredit ? '+' : '-'}{fmt(txn.amount)}
        </div>
        {txn.fee > 0 && <div className="txn-row__fee">Fee: {fmt(txn.fee)}</div>}
        <span className={`badge badge-${txn.status === 'COMPLETED' ? 'green' : txn.status === 'FAILED' ? 'red' : 'yellow'}`}>
          {txn.status}
        </span>
      </div>
    </div>
  );
}