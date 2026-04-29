import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../utils/api';
import './AuthPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username:'', email:'', first_name:'', last_name:'', phone_number:'', password:'', password2:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      const d = err.response?.data;
      if (typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        setError(msgs);
      } else {
        setError('Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
      </div>

      <div className="auth-card auth-card--wide fade-up">
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon"><i className="bi bi-bank2" /></span>
          <span className="auth-card__logo-text">Equi<em>Bank</em></span>
        </div>

        <h1 className="auth-card__heading">Create account</h1>
        <p className="auth-card__sub">A savings account will be created automatically</p>

        {error && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="auth-grid">
            <div className="field">
              <label>First Name</label>
              <input name="first_name" value={form.first_name} onChange={handle} placeholder="Jane" required />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handle} placeholder="Doe" required />
            </div>
            <div className="field">
              <label>Username</label>
              <input name="username" value={form.username} onChange={handle} placeholder="janedoe" required autoFocus />
            </div>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="jane@example.com" />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input name="phone_number" value={form.phone_number} onChange={handle} placeholder="+254 7xx xxx xxx" />
            </div>
            <div className="field" />
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input name="password2" type="password" value={form.password2} onChange={handle} placeholder="••••••••" required />
            </div>
          </div>
          <button className="btn-submit btn-submit--green" disabled={loading}>
            {loading ? <><i className="bi bi-arrow-repeat spin" /> Creating account…</> : <>Create Account <i className="bi bi-arrow-right" /></>}
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}