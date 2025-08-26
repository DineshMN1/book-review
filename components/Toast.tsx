'use client';
import { useEffect } from 'react';

type Props = { id: string; message: string; type?: 'success'|'error'|'info'; onClose: (id: string) => void };

export default function Toast({ id, message, type = 'info', onClose }: Props) {
  useEffect(() => { const t = setTimeout(() => onClose(id), 3000); return () => clearTimeout(t); }, [id, onClose]);
  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-zinc-800';
  return (
    <div className={`text-white px-4 py-2 rounded-xl shadow-lg ${bg}`}>{message}</div>
  );
}



