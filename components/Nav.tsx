'use client';
import Link from 'next/link';
import { useUser } from './UserProvider';

export default function Nav() {
  const { user, logout } = useUser();
  const avatar = user?.data?.avatar as string | undefined;
  const initial = user?.display_name[0]?.toUpperCase() ?? '?';

  return (
    <header className="site-header">
      <Link href="/" className="site-title">wingdingee</Link>
      {user && (
        <nav className="nav-links">
          <Link href="/events/new" className="nav-new-event">
            <span className="nav-new-full">+ new event</span>
            <span className="nav-new-short">+</span>
          </Link>
          <span className="nav-divider" />
          <Link href="/profile" className="nav-profile-link">
            <span className="avatar avatar-sm">
              {avatar ? <img src={avatar} alt="" /> : initial}
            </span>
            <span className="nav-profile-name">{user.display_name}</span>
          </Link>
          <button onClick={logout} className="nav-logout">sign out</button>
        </nav>
      )}
    </header>
  );
}
