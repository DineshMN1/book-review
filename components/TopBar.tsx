// components/TopBar.tsx
'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-zinc-200">
      <div className="container flex items-center justify-between py-3">
        <nav className="flex items-center gap-4">
          <Link className="font-semibold" href="/">BookReview</Link>
          <Link className="link" href="/">Home</Link>
          <Link className="link" href="/admin">Admin</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-zinc-600">Hi, {user.name}</span>
              <button className="btn-outline" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link className="btn" href="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
