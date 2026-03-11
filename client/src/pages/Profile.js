import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, resendVerification, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', contactNumber: user?.contactNumber || '' });

  useEffect(() => {
    setForm({ name: user?.name || '', contactNumber: user?.contactNumber || '' });
  }, [user]);
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    if (res.success) setEditing(false);
  };

  const handleResend = async () => {
    if (!user?.email) return;
    await resendVerification(user.email);
  };

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <div className="profile-left">
          <div className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
          <div className="basic">
            <h2>{user?.name || 'Unknown User'}</h2>
            <div className="muted">{user?.email}</div>
            <div className={`badge ${user?.isVerified ? 'verified' : 'unverified'}`}>{user?.isVerified ? 'Verified' : 'Not verified'}</div>
          </div>
        </div>

        <div className="profile-right">
          <div className="section">
            <h3>Account</h3>
            <div className="row"><span className="label">Role</span><span>{user?.role || 'user'}</span></div>
            <div className="row"><span className="label">Member since</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
          </div>

          <div className="section">
            <h3>Profile</h3>
            {!editing ? (
              <div>
                <div className="row"><span className="label">Name</span><span>{user?.name || '—'}</span></div>
                <div className="row"><span className="label">Contact</span><span>{user?.contactNumber || '—'}</span></div>
                <div className="actions">
                  <button className="btn" onClick={() => { setForm({ name: user?.name || '', contactNumber: user?.contactNumber || '' }); setEditing(true); }}>Edit</button>
                  <button className="btn ghost" onClick={logout}>Logout</button>
                </div>
              </div>
            ) : (
              <form onSubmit={save} className="edit-form">
                <label>
                  Name
                  <input name="name" value={form.name} onChange={onChange} />
                </label>
                <label>
                  Contact Number
                  <input name="contactNumber" value={form.contactNumber} onChange={onChange} />
                </label>
                <div className="actions">
                  <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                  <button className="btn ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="section">
            <h3>Verification</h3>
            {!user?.isVerified && (
              <div>
                <p className="muted">Your email is not verified yet.</p>
                <div className="actions">
                  <button className="btn" onClick={handleResend}>Resend verification</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
