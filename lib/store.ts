'use client';

import { bus, TOPIC } from './eventBus';

/* ========== Types ========== */
export type Role = 'user' | 'admin';
export type User = { id: string; name: string; email: string; password: string; role: Role };
export type Book = {
  id: string;
  title: string;
  author: string;
  description?: string;
  createdAt: number;
  releaseAt?: number; // optional future release timestamp (ms)
};
export type Review = {
  id: string;
  bookId: string;
  userId: string;
  rating: number; // 1..5
  text: string;
  createdAt: number;
};

type Mem = { users: User[]; books: Book[]; reviews: Review[]; currentUserId?: string | null };

/* ========== State (memory only) ========== */
let mem: Mem = { users: [], books: [], reviews: [], currentUserId: null };

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

/* ========== File I/O via API (data/seed.json) ========== */
async function loadFromFile(): Promise<Mem | null> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok || res.status === 204) return null;
    const json = (await res.json()) as Mem;
    // minimal shape validation
    if (!json || !Array.isArray(json.users) || !Array.isArray(json.books) || !Array.isArray(json.reviews)) {
      return null;
    }
    return json;
  } catch {
    return null;
  }
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

/* ========== Manual reload helper (from DevTools or a button) ========== */
export async function reloadFromFileNow() {
  const fileMem = await loadFromFile();
  if (fileMem) {
    mem = fileMem;
    // No LocalStorage; we keep memory and write only on mutations.
    bus.emit(TOPIC.TOAST, { type: 'success', message: 'Reloaded from seed.json' });
    // Optionally notify listeners to re-render if you have a custom hook
    // bus.emit(TOPIC.DATA, undefined);
  } else {
    bus.emit(TOPIC.TOAST, { type: 'error', message: 'seed.json not found or invalid' });
  }
}

/* ========== Initial load (from file only) ========== */
async function load() {
  if (typeof window === 'undefined') return;
  const fileMem = await loadFromFile();
  mem = fileMem ?? { users: [], books: [], reviews: [], currentUserId: null };
  // Do NOT persist here; we only write when something changes.
  // If you want live updates when editing the file while the app is open,
  // call reloadFromFileNow() from a refresh button or the console.
}
if (typeof window !== 'undefined') {
  void load();
}

/* ========== Selectors ========== */
export function getState() { return mem; }

export function getCurrentUser(): User | undefined {
  return mem.users.find(u => u.id === mem.currentUserId);
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin';
}

export function listBooks(): Book[] {
  return [...mem.books].sort((a, b) => b.createdAt - a.createdAt);
}

export function listUpcomingBooks(): Book[] {
  const now = Date.now();
  return mem.books
    .filter(b => typeof b.releaseAt === 'number' && (b.releaseAt as number) > now)
    .sort((a, b) => (a.releaseAt as number) - (b.releaseAt as number));
}

export function getBook(id: string): Book | undefined {
  return mem.books.find(b => b.id === id);
}

export function listReviewsByBook(bookId: string): (Review & { user: User })[] {
  return mem.reviews
    .filter(r => r.bookId === bookId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => ({ ...r, user: mem.users.find(u => u.id === r.userId)! }));
}

// admin-wide list for insights
export function listAllReviews(): Array<{ review: Review; user: User; book: Book }> {
  return mem.reviews
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => ({
      review: r,
      user: mem.users.find(u => u.id === r.userId)!,
      book: mem.books.find(b => b.id === r.bookId)!,
    }));
}

/* ========== Mutations (write to JSON file only) ========== */
export function addBook(input: { title: string; author: string; description?: string; releaseAt?: number }) {
  if (!isAdmin()) throw new Error('Only admins can add books');
  const book: Book = { id: uid('b_'), createdAt: Date.now(), ...input };
  mem.books.push(book);
  void saveToFile();
  bus.emit(TOPIC.BOOK_ADDED, book);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `New book published: ${book.title}` });
  return book;
}

export function deleteReview(reviewId: string) {
  const idx = mem.reviews.findIndex(r => r.id === reviewId);
  if (idx >= 0) {
    mem.reviews.splice(idx, 1);
    void saveToFile();
    bus.emit(TOPIC.TOAST, { type: 'success', message: 'Review deleted' });
  }
}

export function addOrUpdateReview(bookId: string, rating: number, text: string) {
  const user = getCurrentUser();
  if (!user) throw new Error('Login required');
  if (rating < 1 || rating > 5) throw new Error('Rating must be 1..5');

  const existing = mem.reviews.find(r => r.bookId === bookId && r.userId === user.id);
  if (existing) {
    existing.rating = rating;
    existing.text = text;
    existing.createdAt = Date.now();
  } else {
    mem.reviews.push({ id: uid('r_'), bookId, userId: user.id, rating, text, createdAt: Date.now() });
  }
  void saveToFile();
  bus.emit(TOPIC.TOAST, { type: 'success', message: 'Review saved' });
}

/* ========== Auth (persists currentUserId in JSON) ========== */
export function register(name: string, email: string, password: string) {
  email = email.trim().toLowerCase();
  if (mem.users.some(u => u.email === email)) throw new Error('Email already registered');
  const user: User = { id: uid('u_'), name, email, password, role: 'user' };
  mem.users.push(user);
  mem.currentUserId = user.id;
  void saveToFile();
  bus.emit(TOPIC.LOGIN, user);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `Welcome, ${user.name}` });
  return user;
}

export function login(email: string, password: string) {
  email = email.trim().toLowerCase();
  const u = mem.users.find(x => x.email === email && x.password === password);
  if (!u) throw new Error('Invalid credentials');
  mem.currentUserId = u.id;
  void saveToFile();
  bus.emit(TOPIC.LOGIN, u);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `Signed in as ${u.name}` });
  return u;
}

export function logout() {
  mem.currentUserId = null;
  void saveToFile();
  bus.emit(TOPIC.LOGOUT, undefined);
  bus.emit(TOPIC.TOAST, { type: 'info', message: 'Signed out' });
}
