'use client';
import { useState, type FormEvent } from 'react';
import { useUser } from './UserProvider';

export default function Login() {
  const { login } = useUser();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(name);
    } catch {
      setError('something went wrong, try again');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-title">wingdingee</div>
        <p className="login-subtitle">events for people you actually like</p>
        <hr className="divider" />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">display name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="what do your friends call you?"
              autoFocus
              autoComplete="nickname"
            />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
          <button type="submit" className="btn btn-full" disabled={!name.trim() || loading}>
            {loading ? 'joining...' : 'let me in →'}
          </button>
        </form>
      </div>
    </div>
  );
}
