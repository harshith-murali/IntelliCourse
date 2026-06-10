import React, { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import './Profile.css';

const withCacheBust = (url, version) => {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', bio: user.bio || '' });
      setPreview(user.avatarUrl || user.avatar || '');
    }
  }, [user]);

  const handleAvatar = (file) => {
    setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Profile picture must be a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be smaller than 2MB.');
      return;
    }
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (form.bio.length > 500) {
      setError('Bio cannot exceed 500 characters.');
      return;
    }

    const payload = new FormData();
    payload.append('name', form.name.trim());
    payload.append('email', form.email.trim());
    payload.append('bio', form.bio.trim());
    if (avatarFile) payload.append('avatar', avatarFile);

    setSaving(true);
    try {
      const { data } = await api.patch('/user/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.data);
      setPreview(withCacheBust(data.data.avatarUrl || data.data.avatar, Date.now()));
      setMessage('Profile updated successfully.');
      setAvatarFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page container">
      <header className="profile-header">
        <h1>Edit Profile</h1>
        <p>Keep your learning profile accurate and recognizable.</p>
      </header>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="avatar-editor">
          <img src={preview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=student'} alt={form.name || 'Profile'} />
          <label className="avatar-upload">
            <Camera size={18} />
            <span>Change Photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleAvatar(e.target.files?.[0])} />
          </label>
        </div>

        <div className="profile-fields">
          <label>
            Name
            <input value={form.name} maxLength={50} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
          </label>
          <label>
            Bio
            <textarea value={form.bio} maxLength={500} rows={5} onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))} />
            <span className="field-hint">{form.bio.length}/500</span>
          </label>

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <Button type="submit" variant="primary" size="large" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
