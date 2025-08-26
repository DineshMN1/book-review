// app/api/data/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Force Node runtime & no static caching
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'seed.json');

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

function isValidShape(x: any) {
  return x && Array.isArray(x.users) && Array.isArray(x.books) && Array.isArray(x.reviews);
}

export async function GET() {
  try {
    const txt = await fs.readFile(DATA_PATH, 'utf8');
    const json = JSON.parse(txt);
    return NextResponse.json(json, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // file missing or invalid -> no content
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDir();
    const body = await req.json();

    if (!isValidShape(body)) {
      return NextResponse.json({ ok: false, error: 'invalid_shape' }, { status: 400 });
    }

    // atomic-ish write: write temp then rename
    const tmp = path.join(DATA_DIR, `seed.json.tmp-${Date.now()}`);
    await fs.writeFile(tmp, JSON.stringify(body, null, 2), 'utf8');
    await fs.rename(tmp, DATA_PATH);

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'write_failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
