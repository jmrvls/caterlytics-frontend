import { supabase } from '../supabaseClient';

// Owner/Admin side of "Feedback & Ratings".
// Both RPCs are SECURITY DEFINER and scope everything to the caller's own
// business, so no business_id is passed from the browser.

// All reviews for the caller's business, newest first.
// Columns: review_id, rating, comment, created_at, reviewer, package_id,
//          package_name, owner_reply, replied_at
export async function getOwnerReviews() {
  const { data, error } = await supabase.rpc('get_owner_reviews');
  if (error) throw new Error(error.message || 'Failed to load reviews.');
  return (data || []).map((r) => ({
    ...r,
    review_id: Number(r.review_id),
    rating: Number(r.rating) || 0
  }));
}

// Number of reviews in the caller's business that still have no owner reply
// (drives the red badge on the sidebar). Returns 0 for non-Admin/Owner users.
export async function getUnrepliedReviewCount() {
  const { data, error } = await supabase.rpc('get_unreplied_review_count');
  if (error) throw new Error(error.message || 'Failed to load review count.');
  return Number(data) || 0;
}

// Saves (or edits) the owner's public reply. An empty string removes it.
export async function replyToReview(reviewId, reply) {
  const text = (reply || '').trim();
  if (text.length > 1000) throw new Error('Reply is too long (max 1000 characters).');
  const { error } = await supabase.rpc('reply_to_review', {
    p_review_id: reviewId,
    p_reply: text
  });
  if (error) throw new Error(error.message || 'Failed to save reply.');
}

// ---------- pure helpers (no network) ----------

export function summarizeReviews(reviews) {
  const total = reviews.length;
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let replied = 0;
  for (const r of reviews) {
    if (counts[r.rating] !== undefined) counts[r.rating] += 1;
    sum += r.rating;
    if (r.owner_reply) replied += 1;
  }
  return {
    total,
    average: total ? sum / total : null,
    counts,
    replied,
    awaitingReply: total - replied,
    positivePct: total ? Math.round(((counts[4] + counts[5]) / total) * 100) : null
  };
}

export function formatReviewDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}