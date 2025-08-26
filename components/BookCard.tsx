'use client';
import Link from 'next/link';
import type { Book } from '@/lib/store';

export default function BookCard({ book }: { book: Book }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{book.title}</h3>
          <p className="text-sm text-zinc-600">by {book.author}</p>
        </div>
        <Link className="btn" href={`/book/${book.id}`}>Open</Link>
      </div>
      {book.description && <p className="mt-3 text-sm text-zinc-700">{book.description}</p>}
    </div>
  );
}