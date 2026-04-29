import './TxnTable.css';

const TYPE_META = {
  DEPOSIT:    { icon: 'bi-arrow-down-circle-fill', cls: 'green',  sign: '+' },
  WITHDRAWAL: { icon: 'bi-arrow-up-circle-fill',   cls: 'red',    sign: '-' },
  TRANSFER:   { icon: 'bi-send-fill',              cls: 'yellow', sign: '±' },
  FEE:        { icon: 'bi-receipt',                cls: 'muted',  sign: '-' },
  REVERSAL:   { icon: 'bi-arrow-counterclockwise', cls: 'green',  sign: '+' },
};

const STATUS_CLS = {
  COMPLETED: 'badge-green',
  PENDING:   'badge-yellow',
  FAILED:    'badge-red',
  REVERSED:  'badge-muted',
};

export default function TxnTable({ transactions, loading }) {
  if (loading) return (
    <div className="txn-table__loader">
      <i className="bi bi-arrow-repeat spin" />
      <span>Loading transactions…</span>
    </div>
  );

  if (!transactions.length) return (
    <div className="txn-table__empty">
      <i className="bi bi-inbox" />
      <span>No transactions found</span>
    </div>
  );

  return (
    <div className="txn-table-wrap">
      <table className="txn-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Reference</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Fee</th>
            <th>Balance After</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => {
            const meta = TYPE_META[t.transaction_type] || TYPE_META.FEE;
            return (
              <tr key={t.id} className="fade-up" style={{ animationDelay: i * 30 + 'ms' }}>
                <td>
                  <span className={"txn-type-icon txn-type-icon--" + meta.cls}>
                    <i className={"bi " + meta.icon} />
                  </span>
                </td>
                <td><span className="txn-ref">{t.reference}</span></td>
                <td className="txn-desc">{t.description || '—'}</td>
                <td className={"txn-amount text-" + meta.cls}>
                  {meta.sign} KES {Number(t.amount).toLocaleString()}
                </td>
                <td className="text-muted">
                  {Number(t.fee) > 0 ? `KES ${Number(t.fee).toLocaleString()}` : '—'}
                </td>
                <td className="txn-bal">KES {Number(t.balance_after).toLocaleString()}</td>
                <td>
                  <span className={"badge " + (STATUS_CLS[t.status] || 'badge-muted')}>
                    {t.status}
                  </span>
                </td>
                <td className="text-muted txn-date">
                  {new Date(t.created_at).toLocaleDateString('en-KE', { day:'2-digit', month:'short', year:'numeric' })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}