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


export async function reloadFromFileNow() {
  const fileMem = await loadFromFile();
  if (fileMem) {
    mem = fileMem;
    persist();
    bus.emit(TOPIC.TOAST, { type: 'success', message: 'Reloaded from seed.json' });
  } else {
    bus.emit(TOPIC.TOAST, { type: 'error', message: 'seed.json not found or invalid' });
  }
}

/* ========== State ========== */
const KEY = 'brs:data:v3';
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

/* ========== Persistence ========== */
function persist() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(mem));
  // also write to data/seed.json via our API
  void saveToFile();
}

async function load() {
  if (typeof window === 'undefined') return;

  // 1) try LocalStorage cache (fast)
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const cached = JSON.parse(raw) as Mem;
      if (cached && Array.isArray(cached.users) && Array.isArray(cached.books) && Array.isArray(cached.reviews)) {
        mem = cached;
        return; // use cached; background save not needed
      }
    } catch {
      // fall through to file
    }
  }

  // 2) load from data/seed.json via API
  const fileMem = await loadFromFile();
  if (fileMem) {
    mem = fileMem;
  } else {
    // 3) no prefill/seed — start empty as requested
    mem = { users: [], books: [], reviews: [], currentUserId: null };
  }

  persist(); // cache whatever we have
}

// kick async load on client
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

/* ========== Mutations ========== */
export function addBook(input: { title: string; author: string; description?: string; releaseAt?: number }) {
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
    existing.rating = rating;
    existing.text = text;
    existing.createdAt = Date.now();
  } else {
    mem.reviews.push({ id: uid('r_'), bookId, userId: user.id, rating, text, createdAt: Date.now() });
  }
  persist();
  bus.emit(TOPIC.TOAST, { type: 'success', message: 'Review saved' });
}

/* ========== Auth (local only) ========== */
export function register(name: string, email: string, password: string) {
  email = email.trim().toLowerCase();
  if (mem.users.some(u => u.email === email)) throw new Error('Email already registered');
  const user: User = { id: uid('u_'), name, email, password, role: 'user' };
  mem.users.push(user);
  mem.currentUserId = user.id;
  persist();
  bus.emit(TOPIC.LOGIN, user);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `Welcome, ${user.name}` });
  return user;
}

export function login(email: string, password: string) {
  email = email.trim().toLowerCase();
  const u = mem.users.find(x => x.email === email && x.password === password);
  if (!u) throw new Error('Invalid credentials');
  mem.currentUserId = u.id;
  persist();
  bus.emit(TOPIC.LOGIN, u);
  bus.emit(TOPIC.TOAST, { type: 'success', message: `Signed in as ${u.name}` });
  return u;
}

export function logout() {
  mem.currentUserId = null;
  persist();
  bus.emit(TOPIC.LOGOUT, undefined);
  bus.emit(TOPIC.TOAST, { type: 'info', message: 'Signed out' });
}
