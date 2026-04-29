import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
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

      <div className="auth-card fade-up">
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon"><i className="bi bi-bank2" /></span>
          <span className="auth-card__logo-text">Equi<em>Bank</em></span>
        </div>

        <h1 className="auth-card__heading">Welcome back</h1>
        <p className="auth-card__sub">Sign in to your account</p>

        {error && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <div className="field-icon-wrap">
              <i className="bi bi-person field-icon" />
              <input
                name="username" value={form.username}
                onChange={handle} placeholder="your_username"
                required autoFocus
              />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="field-icon-wrap">
              <i className="bi bi-lock field-icon" />
              <input
                name="password" type="password" value={form.password}
                onChange={handle} placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button className="btn-submit btn-submit--green" disabled={loading}>
            {loading ? <><i className="bi bi-arrow-repeat spin" /> Signing in…</> : <>Sign In <i className="bi bi-arrow-right" /></>}
          </button>
        </form>

        <p className="auth-card__switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}