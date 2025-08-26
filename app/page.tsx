'use client';
import BookCard from '@/components/BookCard';
import { listBooks } from '@/lib/store';

export default function HomePage() {
  const books = listBooks();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-2">Books</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {books.map(b => <BookCard key={b.id} book={b} />)}
      </div>
    </div>
  );
}