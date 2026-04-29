import { useEffect, useState } from 'react';
import { getAccounts, getFees, withdraw } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import FormInput from '../components/FormInput';
import Button    from '../components/Button';
import './OperationPage.css';

const fmt = (n) => 'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 });
const toArray = (data) =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.accounts ?? data?.fees ?? [];

export default function Withdraw() {
  const [accounts, setAccounts]     = useState([]);
  const [fees, setFees]             = useState([]);
  const [selectedAcc, setSelectedAcc] = useState('');
  const [amount, setAmount]         = useState('');
  const [desc, setDesc]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  useEffect(() => {
    getAccounts().then(r => {
      const active = toArray(r.data).filter(a => a.status === 'ACTIVE');
      setAccounts(active);
      if (active.length) setSelectedAcc(active[0].id);
    });
    getFees().then(r => setFees(toArray(r.data)));
  }, []);

  const withdrawFee = fees.find(f => f.transaction_type === 'WITHDRAWAL');
  const calcFee = (amt) => {
    if (!withdrawFee || !amt) return 0;
    let fee = parseFloat(withdrawFee.flat_fee) + parseFloat(amt) * parseFloat(withdrawFee.percentage_fee);
    fee = Math.max(fee, parseFloat(withdrawFee.min_fee));
    if (withdrawFee.max_fee) fee = Math.min(fee, parseFloat(withdrawFee.max_fee));
    return fee;
  };

  const estimatedFee  = calcFee(amount);
  const totalDeducted = amount ? (parseFloat(amount) + estimatedFee).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null);
    setLoading(true);
    try {
      const { data } = await withdraw({
        account_id: selectedAcc,
        amount: parseFloat(amount),
        description: desc || 'Withdrawal',
      });
      setResult(data);
      setAmount(''); setDesc('');
    } catch (err) {
      const d = err.response?.data;
      setError(d?.amount?.[0] || d?.account_id?.[0] || d?.detail || 'Withdrawal failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="op-page fade-up">
      <Card>
        <CardHeader title="Withdraw Funds" subtitle="Withdraw money from your account" />

        {withdrawFee && (
          <div className="op-fee-info">
            <i className="bi bi-info-circle-fill" />
            <span>
              Withdrawal fee: KES {withdrawFee.flat_fee} flat + {(parseFloat(withdrawFee.percentage_fee) * 100).toFixed(2)}%
              (min KES {withdrawFee.min_fee}{withdrawFee.max_fee ? `, max KES ${withdrawFee.max_fee}` : ''})
            </span>
          </div>
        )}

        {result && (
          <div className="op-result">
            <i className="bi bi-check-circle-fill" />
            <div>
              <strong>Withdrawal Successful!</strong><br />
              Ref: {result.reference} · New balance: {fmt(result.balance_after)}
            </div>
          </div>
        )}
        {error && (
          <div className="op-error">
            <i className="bi bi-exclamation-triangle-fill" /> {error}
          </div>
        )}

        <div className="op-account-select" style={{ margin: '16px 0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Select Account
          </div>
          {accounts.map(acc => (
            <div
              key={acc.id}
              className={`op-account-card ${selectedAcc === acc.id ? 'op-account-card--selected' : ''}`}
              onClick={() => setSelectedAcc(acc.id)}
            >
              <div className="op-account-card__info">
                <div className="op-account-card__name">{acc.account_type} Account</div>
                <div className="op-account-card__num">{acc.account_number}</div>
              </div>
              <div className="op-account-card__bal">{fmt(acc.balance)}</div>
              <div className="op-account-card__radio" />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="op-form">
          <FormInput
            label="Amount (KES)"
            icon="bi-currency-dollar"
            type="number"
            min="1"
            step="0.01"
            placeholder="Enter amount to withdraw"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            hint={amount ? `Fee: KES ${estimatedFee.toFixed(2)} · Total deducted: KES ${totalDeducted}` : ''}
          />
          <FormInput
            label="Description (optional)"
            icon="bi-chat-text"
            type="text"
            placeholder="e.g. Rent payment"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <Button type="submit" size="lg" loading={loading} icon="bi-arrow-up-circle-fill" className="btn--full">
            Withdraw Funds
          </Button>
        </form>
      </Card>
    </div>
  );
}