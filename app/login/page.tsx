'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  async function submit() {
    try {
      setError('');
      if (mode === 'login') {
        await Promise.resolve(login(email, password));
      } else {
        await Promise.resolve(register(name, email, password));
      }
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Failed');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Login' : 'Create account'}</h1>
        {mode === 'register' && (
          <div className="mb-3">
            <label className="text-sm block mb-1">Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="mb-3">
          <label className="text-sm block mb-1">Email</label>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="text-sm block mb-1">Password</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex items-center gap-2">
          <button onClick={submit} className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>
          <button className="btn-outline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create new account' : 'Have an account? Login'}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-3">Demo accounts: admin@example.com / admin123 (admin), alice@example.com / pass123</p>
      </div>
    </div>
  );
}