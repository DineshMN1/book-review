'use client';
import { useMemo } from 'react';

type Props = { value: number; onChange?: (v: number) => void; readOnly?: boolean };
export default function StarRating({ value, onChange, readOnly }: Props) {
  const stars = useMemo(() => [1,2,3,4,5], []);
  return (
    <div className="inline-flex gap-1">
      {stars.map(n => (
        <button
          key={n}
          type="button"
          aria-label={`rate ${n}`}
          onClick={() => !readOnly && onChange?.(n)}
          className={`text-xl ${n <= value ? 'text-yellow-500' : 'text-zinc-300'} ${readOnly ? 'cursor-default' : 'hover:scale-105'}`}
        >★</button>
      ))}
    </div>
  );
}
