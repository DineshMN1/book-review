// Tiny rule-based sentiment (no deps)
// Returns: { label: 'positive'|'neutral'|'negative', emoji: string, score: number }

const POS = new Set([
  'good','great','excellent','amazing','love','loved','like','liked','awesome',
  'fantastic','wonderful','perfect','nice','enjoy','enjoyed','best','cool',
  'happy','pleased','satisfied','recommend','brilliant','superb'
]);

const NEG = new Set([
  'bad','terrible','awful','hate','hated','dislike','disliked','poor',
  'worse','worst','boring','buggy','slow','trash','horrible','sad',
  'angry','disappointed','issue','problem','refund','waste','broken'
]);

function tokenize(text: string) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function analyzeSentiment(
  text: string
): { label: 'positive'|'neutral'|'negative'; emoji: string; score: number } {
  const toks = tokenize(text);
  let score = 0;
  for (const t of toks) {
    if (POS.has(t)) score += 1;
    if (NEG.has(t)) score -= 1;
  }
  let label: 'positive'|'neutral'|'negative' = 'neutral';
  let emoji = '😐';
  if (score >= 2) { label = 'positive'; emoji = '😊'; }
  else if (score <= -2) { label = 'negative'; emoji = '😞'; }
  return { label, emoji, score };
}
