'use client';
import { useState } from 'react';
import StarRating from './StarRating';
import { addOrUpdateReview } from '@/lib/store';

export default function ReviewForm({ bookId }: { bookId: string }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    try {
      setLoading(true); setError('');
      await Promise.resolve(addOrUpdateReview(bookId, rating, text));
      setText('');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally { setLoading(false); }
  }

  return (
    <div className="card">
      <h4 className="font-semibold mb-2">Your review</h4>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-zinc-600">Rating:</span>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <textarea className="input h-24" value={text} onChange={e => setText(e.target.value)} placeholder="Write your thoughts..." />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="mt-3">
        <button onClick={submit} disabled={loading} className="btn">{loading ? 'Saving...' : 'Submit review'}</button>
      </div>
    </div>
  );
}