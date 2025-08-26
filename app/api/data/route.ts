import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'seed.json');

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

export async function GET() {
  try {
    const txt = await fs.readFile(DATA_PATH, 'utf8');
    const json = JSON.parse(txt);
    return NextResponse.json(json);
  } catch {
    // no file yet → empty response (client will seed)
    return new NextResponse(null, { status: 204 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDir();
    const body = await req.json();
    await fs.writeFile(DATA_PATH, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'write_failed' }, { status: 500 });
  }
}
