'use client';

import { listAllReviews } from '@/lib/store';
import { analyzeSentiment } from '@/lib/sentiment';
import StarRating from './StarRating';

export default function ReviewInsights() {
  const rows = listAllReviews();
  if (rows.length === 0) return <p className="text-sm text-zinc-600">No reviews yet.</p>;

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Review Sentiment (Admin)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-zinc-600">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Book</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Rating</th>
              <th className="py-2 pr-3">Sentiment</th>
              <th className="py-2 pr-3">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ review, user, book }) => {
              const s = analyzeSentiment(review.text);
              const when = new Date(review.createdAt).toLocaleString();
              const short = review.text.length > 120 ? review.text.slice(0, 117) + '…' : review.text;
              return (
                <tr key={review.id} className="border-t border-zinc-200">
                  <td className="py-2 pr-3 whitespace-nowrap">{when}</td>
                  <td className="py-2 pr-3">{book.title}</td>
                  <td className="py-2 pr-3">{user.name}</td>
                  <td className="py-2 pr-3"><StarRating value={review.rating} readOnly /></td>
                  <td className="py-2 pr-3 whitespace-nowrap">{s.emoji} {s.label}</td>
                  <td className="py-2 pr-3">{short}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
