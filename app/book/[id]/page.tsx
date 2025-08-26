'use client';
import { getBook } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import { useAuth } from '@/lib/auth';

export default function BookPage() {
  const params = useParams<{ id: string }>();
  const book = getBook(params.id);
  const { user } = useAuth();
  const router = useRouter();

  if (!book) return <p>Book not found.</p>;

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        <p className="text-sm text-zinc-600">by {book.author}</p>
        {book.description && <p className="mt-3 text-sm">{book.description}</p>}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Reviews</h2>
        <ReviewList bookId={book.id} />
      </section>

      <section>
        {user ? (
          <ReviewForm bookId={book.id} />
        ) : (
          <div className="card">
            <p className="text-sm">Please login to write a review.</p>
            <button className="btn mt-2" onClick={() => router.push('/login')}>Login</button>
          </div>
        )}
      </section>
    </div>
  );
}