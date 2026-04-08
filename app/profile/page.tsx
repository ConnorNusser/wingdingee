'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 320;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const out = Math.min(size, MAX);
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, out, out);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, loaded, updateProfile } = useUser();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setBio((user.data?.bio as string) ?? '');
      setAvatarPreview((user.data?.avatar as string) ?? '');
    }
  }, [user]);

  if (!loaded) return null;
  if (!user) {
    return (
      <main className="container">
        <p className="text-muted">you need to be logged in to view your profile.</p>
      </main>
    );
  }

  const initial = user.display_name[0]?.toUpperCase() ?? '?';

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setAvatarPreview(compressed);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('display name is required'); return; }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({ display_name: displayName, bio, avatar: avatarPreview });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('failed to save — try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container">
      <Link href="/" className="back-link">← back</Link>

      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <button
            type="button"
            className="avatar avatar-lg avatar-upload-btn"
            onClick={handleAvatarClick}
            title="change photo"
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="your avatar" />
              : <span>{initial}</span>
            }
            <div className="avatar-overlay">
              <span>change</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <div className="profile-hero-info">
          <div className="profile-hero-name">{user.display_name}</div>
          <div className="profile-hero-since text-muted">
            member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          {avatarPreview && (
            <button type="button" className="avatar-remove-btn" onClick={handleRemoveAvatar}>
              remove photo
            </button>
          )}
        </div>
      </div>

      <hr className="divider" />

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>edit profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="display-name">display name</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="your name"
            maxLength={60}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="a little about you (optional)"
            maxLength={280}
            rows={3}
          />
          <div className="char-count">{bio.length}/280</div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="profile-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'saving…' : 'save changes'}
          </button>
          {saved && <span className="save-confirm">✓ saved</span>}
        </div>
      </form>
    </main>
  );
}
