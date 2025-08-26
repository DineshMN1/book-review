'use client';
import { deleteReview, listReviewsByBook } from '@/lib/store';
import { useEffect, useState } from 'react';
import StarRating from './StarRating';
import { useAuth } from '@/lib/auth';

export default function ReviewList({ bookId }: { bookId: string }) {
  const [items, setItems] = useState(listReviewsByBook(bookId));
  const { user } = useAuth();

  useEffect(() => {
    // simple refetch when component mounts
    setItems(listReviewsByBook(bookId));
  }, [bookId]);

  function handleDelete(id: string) {
    deleteReview(id);
    setItems(listReviewsByBook(bookId));
  }

  if (items.length === 0) return <p className="text-sm text-zinc-600">No reviews yet.</p>;

  return (
    <ul className="space-y-3">
      {items.map(r => (
        <li key={r.id} className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StarRating value={r.rating} readOnly />
              <span className="text-sm text-zinc-600">by {r.user.name}</span>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => handleDelete(r.id)} className="btn-outline">Delete</button>
            )}
          </div>
          <p className="mt-2 text-sm">{r.text}</p>
        </li>
      ))}
    </ul>
  );
}