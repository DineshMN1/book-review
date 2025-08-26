'use client';

import { bus, TOPIC } from './eventBus';

/* ========== Types ========== */
export type Role = 'user' | 'admin';
export type User = { id: string; name: string; email: string; password: string; role: Role };
export type Book = { id: string; title: string; author: string; description?: string; createdAt: number };
export type Review = { id: string; bookId: string; userId: string; rating: number; text: string; createdAt: number };
type Mem = { users: User[]; books: Book[]; reviews: Review[]; currentUserId?: string | null };

/* ========== State ========== */
const KEY = 'brs:data:v2';
let mem: Mem = { users: [], books: [], reviews: [], currentUserId: null };
function uid(prefix = '') { return prefix + Math.random().toString(36).slice(2, 10); }

/* ========== Fallback code seed (used only if no localStorage and no file) ========== */
function codeSeed(): Mem {
  const admin: User = { id: uid('u_'), name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' };
  const alice: User = { id: uid('u_'), name: 'Alice', email: 'alice@example.com', password: 'pass123', role: 'user' };
  const book1: Book = { id: uid('b_'), title: 'The Silent Pages', author: 'A. Grey', description: 'A mystery novel about lost letters.', createdAt: Date.now() - 86_400_000 };
  const book2: Book = { id: uid('b_'), title: 'Neon Skies', author: 'K. Vale', description: 'Cyberpunk adventures over a neon city.', createdAt: Date.now() - 3_600_000 };
  const r1: Review = { id: uid('r_'), bookId: book1.id, userId: alice.id, rating: 4, text: 'Loved the pacing and the twist!', createdAt: Date.now() - 820_000 };
  return { users: [admin, alice], books: [book1, book2], reviews: [r1], currentUserId: null };
}

/* ========== File I/O via API ========== */
async function loadFromFile(): Promise<Mem | null> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return (await res.json()) as Mem;
  } catch { return null; }
}

async function saveToFile(): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mem),
    });
  } catch {
    // ignore in dev
  }
}

/* ========== Persistence ========== */
function persist() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(mem));
  // also write the text file (fire-and-forget)
  void saveToFile();
}

async function load() {
  if (typeof window === 'undefined') return;
  // 1) try LocalStorage (fast path)
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try { mem = JSON.parse(raw) as Mem; } catch {}
  }

  if (!raw) {
    // 2) try reading from text file
    const fileMem = await loadFromFile();
    if (fileMem && Array.isArray(fileMem.users)) {
      mem = fileMem;
    } else {
      // 3) fallback to code seed
      mem = codeSeed();
    }
    persist();
  }
}
// kick async load
if (typeof window !== 'undefined') { void load(); }

/* ========== Selectors ========== */
export function getState() { return mem; }
export function getCurrentUser(): User | undefined { return mem.users.find(u => u.id === mem.currentUserId); }
export function isAdmin() { return getCurrentUser()?.role === 'admin'; }

export function listBooks(): Book[] { return [...mem.books].sort((a,b) => b.createdAt - a.createdAt); }
export function getBook(id: string): Book | undefined { return mem.books.find(b => b.id === id); }
export function listReviewsByBook(bookId: string): (Review & { user: User })[] {
  return mem.reviews
    .filter(r => r.bookId === bookId)
    .sort((a,b) => b.createdAt - a.createdAt)
    .map(r => ({ ...r, user: mem.users.find(u => u.id === r.userId)! }));
}

/* ========== Mutations ========== */
export function addBook(input: { title: string; author: string; description?: string }) {
  if (!isAdmin()) throw new Error('Only admins can add books');
  const book: Book = { id: uid('b_'), createdAt: Date.now(), ...input };
  mem.books.push(book);
  persist();
  bus.emit(TOPIC.BOOK_ADDED, book);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `New book published: ${book.title}` });
  return book;
}

export function deleteReview(reviewId: string) {
  const idx = mem.reviews.findIndex(r => r.id === reviewId);
  if (idx >= 0) {
    mem.reviews.splice(idx, 1);
    persist();
    bus.emit(TOPIC.TOAST, { type: 'success', message: 'Review deleted' });
  }
}

export function addOrUpdateReview(bookId: string, rating: number, text: string) {
  const user = getCurrentUser();
  if (!user) throw new Error('Login required');
  if (rating < 1 || rating > 5) throw new Error('Rating must be 1..5');

  const existing = mem.reviews.find(r => r.bookId === bookId && r.userId === user.id);
  if (existing) {
    existing.rating = rating; existing.text = text; existing.createdAt = Date.now();
  } else {
    mem.reviews.push({ id: uid('r_'), bookId, userId: user.id, rating, text, createdAt: Date.now() });
  }
  persist();
  bus.emit(TOPIC.TOAST, { type: 'success', message: 'Review saved' });
}

/* ========== Auth (local) ========== */
export function register(name: string, email: string, password: string) {
  email = email.trim().toLowerCase();
  if (mem.users.some(u => u.email === email)) throw new Error('Email already registered');
  const user: User = { id: uid('u_'), name, email, password, role: 'user' };
  mem.users.push(user); mem.currentUserId = user.id; persist();
  bus.emit(TOPIC.LOGIN, user);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `Welcome, ${user.name}` });
  return user;
}

export function login(email: string, password: string) {
  email = email.trim().toLowerCase();
  const u = mem.users.find(x => x.email === email && x.password === password);
  if (!u) throw new Error('Invalid credentials');
  mem.currentUserId = u.id; persist();
  bus.emit(TOPIC.LOGIN, u);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `Signed in as ${u.name}` });
  return u;
}

export function logout() {
  mem.currentUserId = null; persist();
  bus.emit(TOPIC.LOGOUT, undefined);
  bus.emit(TOPIC.TOAST, { type: 'info', message: 'Signed out' });
}
