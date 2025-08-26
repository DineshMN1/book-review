'use client';
import { useEffect, useState } from 'react';

function fmt(n: number) { return n.toString().padStart(2, '0'); }

export default function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const sec = Math.floor(diff / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (diff <= 0) return <span className="text-green-600 font-medium">Released</span>;
  return <span className="font-mono">{d}d {fmt(h)}:{fmt(m)}:{fmt(s)}</span>;
}
