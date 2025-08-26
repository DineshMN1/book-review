'use client';

import Link from 'next/link';
import { listUpcomingBooks } from '@/lib/store';
import dynamic from 'next/dynamic';

// ⬇️ countdown only on the client
const Countdown = dynamic(() => import('./Countdown'), { ssr: false });

export default function UpcomingList() {
  const items = listUpcomingBooks();
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Upcoming</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(b => (
          <li key={b.id} className="card flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold">{b.title}</div>
              <div className="text-sm text-zinc-600">by {b.author}</div>
              {b.description && <p className="text-sm mt-2">{b.description}</p>}
              <div className="text-xs text-zinc-500 mt-2">
                Release: {new Date(b.releaseAt!).toLocaleString()}
              </div>
              <Link className="link text-sm mt-2 inline-block" href={`/book/${b.id}`}>View</Link>
            </div>
            <Countdown target={b.releaseAt!} />
          </li>
        ))}
      </ul>
    </section>
  );
}
