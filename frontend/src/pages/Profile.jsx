import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../utils/api';
import Card, { CardHeader } from '../components/Card';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import './Profile.css';

export default function Profile() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    first_name:    user?.first_name    || '',
    last_name:     user?.last_name     || '',
    email:         user?.email         || '',
    phone_number:  user?.phone_number  || '',
    date_of_birth: user?.date_of_birth || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const { data } = await updateMe(form);
      setUser(data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      const d = err.response?.data;
      setError(d?.email?.[0] || d?.phone_number?.[0] || d?.detail || 'Update failed.');
    } finally {
      setLoading(false);
    }
  }

  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('') || user?.username?.[0]?.toUpperCase();

  return (
    <div className="profile-page fade-up">

      {/* Avatar + identity */}
      <Card className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-hero__info">
          <div className="profile-hero__name">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="profile-hero__username">@{user?.username}</div>
          <span className={`badge badge-${user?.is_verified ? 'green' : 'red'}`}>
            <i className={`bi bi-${user?.is_verified ? 'patch-check-fill' : 'shield-exclamation'}`} />
            {user?.is_verified ? ' Verified' : ' Unverified'}
          </span>
        </div>
      </Card>

      {/* Read-only info */}
      <Card style={{ marginBottom: 0 }}>
        <CardHeader title="Account Details" subtitle="Non-editable account information" />
        <div className="profile-meta">
          {[
            { label: 'Username',    value: user?.username,   icon: 'bi-person' },
            { label: 'National ID', value: user?.national_id || '—', icon: 'bi-card-text' },
            { label: 'Member Since', value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' })
                : '—',
              icon: 'bi-calendar3'
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="profile-meta__item">
              <span className="profile-meta__icon"><i className={`bi ${icon}`} /></span>
              <div>
                <div className="profile-meta__label">{label}</div>
                <div className="profile-meta__val">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Editable form */}
      <Card>
        <CardHeader title="Edit Profile" subtitle="Update your personal information" />

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
          <div className="profile-form-row">
            <FormInput
              label="First Name" icon="bi-person"
              name="first_name" value={form.first_name}
              onChange={handle} placeholder="John"
            />
            <FormInput
              label="Last Name" icon="bi-person"
              name="last_name" value={form.last_name}
              onChange={handle} placeholder="Doe"
            />
          </div>
          <FormInput
            label="Email" icon="bi-envelope"
            type="email" name="email" value={form.email}
            onChange={handle} placeholder="john@example.com"
          />
          <FormInput
            label="Phone Number" icon="bi-phone"
            type="tel" name="phone_number" value={form.phone_number}
            onChange={handle} placeholder="+254700000000"
          />
          <FormInput
            label="Date of Birth" icon="bi-calendar"
            type="date" name="date_of_birth" value={form.date_of_birth}
            onChange={handle}
          />
          <Button type="submit" size="lg" loading={loading} icon="bi-check2-circle" className="btn--full">
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}