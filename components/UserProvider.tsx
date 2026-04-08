'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/lib/supabase';

interface UserContextValue {
  user: User | null;
  loaded: boolean;
  login: (displayName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fields: { display_name: string; bio?: string; avatar?: string }) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = 'wingdingee_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored) as User); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  const login = async (displayName: string) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName.trim() }),
    });
    if (!res.ok) throw new Error('Failed to create user');
    const newUser = await res.json() as User;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async ({ display_name, bio, avatar }: { display_name: string; bio?: string; avatar?: string }) => {
    if (!user) return;
    const newData = { ...user.data };
    if (bio !== undefined) newData.bio = bio.trim();
    if (avatar !== undefined) newData.avatar = avatar;
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, display_name: display_name.trim(), data: newData }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const updated = await res.json() as User;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <UserContext.Provider value={{ user, loaded, login, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}
