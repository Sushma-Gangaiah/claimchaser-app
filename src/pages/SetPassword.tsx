import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitationAPI } from '../api/invitation';
import '../styles/SetPassword.css';

export const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; full_name: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await invitationAPI.verifyToken(token!);
      setUserInfo(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired invitation token');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await invitationAPI.setPassword(token!, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set password');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="loading">Verifying invitation...</div>
        </div>
      </div>
    );
  }

  if (error && !userInfo) {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="logo-container">
            <img src="/logo.png" alt="Claim Chaser" className="logo" />
          </div>
          <div className="error-box">{error}</div>
          <button onClick={() => navigate('/login')} className="back-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="logo-container">
            <img src="/logo.png" alt="Claim Chaser" className="logo" />
          </div>
          <div className="success-box">
            <h2>Password Set Successfully!</h2>
            <p>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-page">
      <div className="set-password-container">
        <div className="logo-container">
          <img src="/logo.png" alt="Claim Chaser" className="logo" />
        </div>

        <div className="welcome-section">
          <h1>Welcome to Claim Chaser!</h1>
          <p className="user-greeting">Hi {userInfo?.full_name},</p>
          <p className="instruction">Please set up your password to activate your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={userInfo?.email || ''}
              disabled
              className="email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 8 characters)"
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Setting Password...' : 'Set Password & Activate Account'}
          </button>
        </form>

        <div className="footer-note">
          <p>Already have an account? <a href="/login">Log in</a></p>
        </div>
      </div>
    </div>
  );
};
