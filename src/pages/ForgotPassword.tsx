import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import '../styles/ForgotPassword.css';
import logo from '../assets/logo-dark.png';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setSubmitting(true);

    try {
      await authAPI.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset email');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="logo-container">
            <img src={logo} alt="Claim Chaser" className="logo" />
          </div>
          <div className="success-box">
            <h2>Check Your Email</h2>
            <p>
              If an account with email <strong>{email}</strong> exists,
              we've sent a password reset link to that address.
            </p>
            <p>The link will expire in 24 hours.</p>
          </div>
          <button onClick={() => navigate('/login')} className="back-button">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="logo-container">
          <img src={logo} alt="Claim Chaser" className="logo" />
        </div>

        <div className="header-section">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="footer-links">
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
};
