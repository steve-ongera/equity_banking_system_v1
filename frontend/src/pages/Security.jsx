import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import './Security.css';

export default function Security() {
  const { user, logout } = useAuth();

  const [form, setForm]     = useState({ old_password: '', new_password: '', confirm: '' });
  const [show, setShow]     = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }));

  async function submit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.new_password !== form.confirm) {
      setError('New passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await changePassword({ old_password: form.old_password, new_password: form.new_password });
      setSuccess('Password changed. Please log in again.');
      setForm({ old_password: '', new_password: '', confirm: '' });
      setTimeout(logout, 2500);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.old_password?.[0] || d?.new_password?.[0] || d?.detail || 'Password change failed.');
    } finally {
      setLoading(false);
    }
  }

  // Password strength
  const pw = form.new_password;
  const strength = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ];
  const strengthScore = strength.filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = ['', 'var(--red)', 'var(--yellow)', '#4fc', 'var(--green)'][strengthScore];

  return (
    <div className="security-page fade-up">

      {/* Account overview */}
      <Card className="security-info">
        <div className="security-info__row">
          <span className="security-info__icon"><i className="bi bi-shield-check-fill" /></span>
          <div>
            <div className="security-info__title">Account Security</div>
            <div className="security-info__sub">@{user?.username} · {user?.email}</div>
          </div>
          <span className={`badge badge-${user?.is_verified ? 'green' : 'red'}`}>
            {user?.is_verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </Card>

      {/* Security tips */}
      <Card>
        <CardHeader title="Security Tips" subtitle="Keep your account safe" />
        <div className="security-tips">
          {[
            { icon: 'bi-key-fill',          tip: 'Use a strong, unique password you don\'t use elsewhere.' },
            { icon: 'bi-eye-slash-fill',     tip: 'Never share your password or PIN with anyone.' },
            { icon: 'bi-phone-fill',         tip: 'Keep your registered phone number up to date.' },
            { icon: 'bi-wifi-off',           tip: 'Avoid banking on public or unsecured Wi-Fi networks.' },
          ].map(({ icon, tip }) => (
            <div key={tip} className="security-tip">
              <span className="security-tip__icon"><i className={`bi ${icon}`} /></span>
              <span className="security-tip__text">{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader title="Change Password" subtitle="Update your account password" />

        {success && (
          <div className="op-result" style={{ marginBottom: 16 }}>
            <i className="bi bi-check-circle-fill" /> {success}
          </div>
        )}
        {error && (
          <div className="op-error" style={{ marginBottom: 16 }}>
            <i className="bi bi-exclamation-triangle-fill" /> {error}
          </div>
        )}

        <form onSubmit={submit} className="op-form">
          {/* Current password */}
          <div className="field">
            <label>Current Password</label>
            <div className="field-icon-wrap">
              <i className="bi bi-lock field-icon" />
              <input
                name="old_password" type={show.old ? 'text' : 'password'}
                value={form.old_password} onChange={handle}
                placeholder="••••••••" required
              />
              <button type="button" className="field-icon-wrap__toggle"
                onClick={() => toggle('old')} tabIndex={-1}
                aria-label={show.old ? 'Hide' : 'Show'}>
                <i className={`bi ${show.old ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="field">
            <label>New Password</label>
            <div className="field-icon-wrap">
              <i className="bi bi-lock-fill field-icon" />
              <input
                name="new_password" type={show.new ? 'text' : 'password'}
                value={form.new_password} onChange={handle}
                placeholder="••••••••" required
              />
              <button type="button" className="field-icon-wrap__toggle"
                onClick={() => toggle('new')} tabIndex={-1}
                aria-label={show.new ? 'Hide' : 'Show'}>
                <i className={`bi ${show.new ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {pw && (
              <div className="security-strength">
                <div className="security-strength__bars">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="security-strength__bar"
                      style={{ background: i < strengthScore ? strengthColor : 'var(--border)' }} />
                  ))}
                </div>
                <span style={{ color: strengthColor, fontSize:'0.78rem', fontWeight:600 }}>
                  {strengthLabel}
                </span>
              </div>
            )}
            <ul className="security-rules">
              {[
                [pw.length >= 8,          'At least 8 characters'],
                [/[A-Z]/.test(pw),        'One uppercase letter'],
                [/[0-9]/.test(pw),        'One number'],
                [/[^A-Za-z0-9]/.test(pw), 'One special character'],
              ].map(([ok, label]) => (
                <li key={label} style={{ color: ok ? 'var(--green)' : 'var(--muted)' }}>
                  <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-circle'}`} /> {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Confirm */}
          <div className="field">
            <label>Confirm New Password</label>
            <div className="field-icon-wrap">
              <i className="bi bi-lock-fill field-icon" />
              <input
                name="confirm" type={show.confirm ? 'text' : 'password'}
                value={form.confirm} onChange={handle}
                placeholder="••••••••" required
              />
              <button type="button" className="field-icon-wrap__toggle"
                onClick={() => toggle('confirm')} tabIndex={-1}
                aria-label={show.confirm ? 'Hide' : 'Show'}>
                <i className={`bi ${show.confirm ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {form.confirm && form.new_password !== form.confirm && (
              <div style={{ fontSize:'0.8rem', color:'var(--red)', marginTop:4 }}>
                <i className="bi bi-x-circle" /> Passwords do not match
              </div>
            )}
          </div>

          <Button type="submit" size="lg" loading={loading} icon="bi-shield-lock-fill" className="btn--full">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}