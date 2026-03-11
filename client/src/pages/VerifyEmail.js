import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const { verifyEmail: verifyEmailApi } = useAuth();
  const [status, setStatus] = useState('idle');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setStatus('verifying');
      const res = await verifyEmail(token);
      if (res.success) {
        setStatus('success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setStatus('failed');
      }
    };
    run();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const res = await resendVerification(email);
    setLoading(false);
    if (res.success) {
      setStatus('resent');
    } else {
      setStatus('resend-failed');
    }
  };

  const handleSendCode = async () => {
    if (!email) return setMessage('Please enter your email to receive a code');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-verification-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) {
        setMessage('Verification code sent — check your email');
      } else {
        setMessage(data.message || 'Failed to send code');
      }
    } catch (err) {
      setMessage('Network error while sending code');
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (!email || !code) return setMessage('Please provide email and code');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (data.success) {
        setMessage('Email verified successfully — redirecting to login');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (err) {
      setMessage('Network error while verifying code');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <h1>Email Verification</h1>
      {!token && (
        <div>
          <p>Please check your email and click the verification link to activate your account.</p>
          <p>If you didn't receive the email, enter your email below to resend the verification link.</p>

          <form onSubmit={handleResend} style={{ marginTop: 16 }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '8px', width: 300, maxWidth: '90%' }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Resend Verification'}</button>
            </div>
          </form>

          <div style={{ marginTop: 16 }}>
            <p>Or request a 6-digit verification code:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <input style={{ padding: 8, width: 200 }} placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <button onClick={handleSendCode} disabled={loading}>{loading ? 'Sending...' : 'Send Code'}</button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <input style={{ padding: 8, width: 120 }} placeholder="Enter 6-digit code" value={code} onChange={e => setCode(e.target.value)} />
              <button onClick={handleVerifyCode} disabled={loading}>{loading ? 'Verifying...' : 'Verify Code'}</button>
            </div>
            {message && <p style={{ marginTop: 12 }}>{message}</p>}
          </div>

          {status === 'resent' && <p style={{ color: 'green', marginTop: 12 }}>Verification email resent — check your inbox.</p>}
          {status === 'resend-failed' && <p style={{ color: 'red', marginTop: 12 }}>Failed to resend verification. Check server logs or try again.</p>}
        </div>
      )}

      {token && status === 'verifying' && <p>Verifying your email...</p>}
      {token && status === 'success' && <p>Your email has been verified. Redirecting to login...</p>}
      {token && status === 'failed' && <p>Verification failed or the token expired. Please request a new verification email.</p>}
    </div>
  );
};

export default VerifyEmail;
