'use client';

import { addBook, isAdmin } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';

// lazy-load backup UI for client only


export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // if not admin, show gentle hint to login as admin
  if (!isAdmin()) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-600 mb-2">Not authorized. Login as admin.</p>
        <Link href="/login" className="btn">Go to Login</Link>
        <p className="text-xs text-zinc-600 mt-2">
          Demo admin: <code>admin@example.com / admin123</code>
        </p>
      </div>
    );
  }

  const canSubmit = useMemo(
    () => title.trim().length > 0 && author.trim().length > 0 && !busy,
    [title, author, busy]
  );

  const submit = useCallback(() => {
    try {
      setBusy(true);
      setError('');
      if (!title.trim() || !author.trim()) throw new Error('Title and author are required');
      addBook({
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
      });
      setTitle('');
      setAuthor('');
      setDescription('');
      router.push('/');
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }, [title, author, description, router]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canSubmit) submit();
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Publish a new book</h1>
        <div className="card space-y-3" onKeyDown={onKeyDown}>
          <div>
            <label className="text-sm block mb-1">Title</label>
            <input
              className="input"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g., The Art of Clean Code"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Author</label>
            <input
              className="input"
              value={author}
              onChange={e => { setAuthor(e.target.value); setError(''); }}
              placeholder="e.g., J. Harper"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Description</label>
            <textarea
              className="input h-24"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)…"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="btn" onClick={submit} disabled={!canSubmit}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
          <p className="text-xs text-zinc-600">
            All users currently browsing will see a toast: “New book published …”.
          </p>
          <p className="text-xs text-zinc-600">
            Tip: Press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>Enter</kbd> to publish quickly.
          </p>
        </div>
      </div>

      {/* Backup panel (download/import + OPFS save) */}

    </div>
  );
}
