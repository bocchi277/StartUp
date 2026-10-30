export type ReviewRow = {
  id: string;
  rating: number;
  would_return: boolean;
  terms_matched?: boolean | null;
  paid_on_time?: boolean | null;
  comment: string | null;
  response: string | null;
  response_at: string | null;
  created_at: string;
  author?: string | null;
};

export type ReviewSummary = {
  count: number;
  average: number;
  wouldReturnPct: number | null;
  termsMatchedPct: number | null;
  paidOnTimePct: number | null;
};

function pct(values: (boolean | null | undefined)[]) {
  const known = values.filter((v): v is boolean => typeof v === "boolean");
  return known.length ? Math.round((known.filter(Boolean).length / known.length) * 100) : null;
}

export function summarize(rows: ReviewRow[]): ReviewSummary {
  const count = rows.length;
  return {
    count,
    average: count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0,
    wouldReturnPct: pct(rows.map((r) => r.would_return)),
    termsMatchedPct: pct(rows.map((r) => r.terms_matched)),
    paidOnTimePct: pct(rows.map((r) => r.paid_on_time)),
  };
}

/** Reviews open once the placement has ended, or after 30 days of working. */
export function canReviewPlacement(p: { status: string; start_date: string; worker_confirmed_at: string | null }) {
  if (!p.worker_confirmed_at) return false;
  if (p.status === "ended") return true;
  if (p.status !== "active") return false;
  return Date.now() - new Date(p.start_date).getTime() >= 30 * 86_400_000;
}
