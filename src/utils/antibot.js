// Simple client-side protections for the public forms (login / register).
// NOTE: this is a deterrent, not real security -- the real limits live in
// Supabase (Auth rate limits + the edge functions). It stops casual
// brute-force attempts and dumb bots.

const PREFIX = 'rl:'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key) || '{"fails":0,"until":0}')
  } catch {
    return { fails: 0, until: 0 }
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage unavailable -- skip silently
  }
}

// Returns seconds left in lockout (0 = allowed to try).
export function lockoutSecondsLeft(key) {
  const { until } = read(key)
  return Math.max(0, Math.ceil((until - Date.now()) / 1000))
}

// Call after a failed attempt. After `maxFails` failures the form locks;
// each further lockout doubles (30s, 60s, 120s ... capped at 15 min).
export function recordFailure(key, maxFails = 5, baseSeconds = 30) {
  const state = read(key)
  state.fails += 1
  if (state.fails >= maxFails) {
    const round = state.fails - maxFails
    const seconds = Math.min(baseSeconds * 2 ** round, 15 * 60)
    state.until = Date.now() + seconds * 1000
  }
  write(key, state)
  return lockoutSecondsLeft(key)
}

export function resetFailures(key) {
  write(key, { fails: 0, until: 0 })
}

// Honeypot: real users never see or fill the hidden field. A bot that
// auto-fills every input will. Also rejects forms submitted absurdly fast.
export function looksLikeBot(honeypotValue, mountedAt, minMs = 1500) {
  if (honeypotValue) return true
  if (Date.now() - mountedAt < minMs) return true
  return false
}

// ---------- Sliding-window limiter (for "send OTP" style actions) ----------
// Allows at most `max` actions per `windowSeconds`. Unlike recordFailure()
// (which counts *failures*), this counts every attempt -- which is what we want
// for anything that costs money (SMS) whether or not it "succeeds".
// Same caveat as above: it lives in localStorage so it is a deterrent only;
// the real limits are server-side (Supabase Auth + the edge functions).

const WIN_PREFIX = 'rlw:'

function readHits(key) {
  try {
    const arr = JSON.parse(localStorage.getItem(WIN_PREFIX + key) || '[]')
    return Array.isArray(arr) ? arr.filter((t) => typeof t === 'number') : []
  } catch {
    return []
  }
}

// Seconds until another action is allowed (0 = allowed now).
// `cooldownSeconds` (optional) additionally enforces a minimum gap between two
// actions, e.g. 60s between "Resend code" clicks.
export function rateLimitSecondsLeft(key, max, windowSeconds, cooldownSeconds = 0) {
  const now = Date.now()
  const hits = readHits(key).filter((t) => now - t < windowSeconds * 1000)
  let wait = 0
  if (hits.length >= max) {
    wait = Math.ceil((hits[0] + windowSeconds * 1000 - now) / 1000)
  }
  if (cooldownSeconds > 0 && hits.length > 0) {
    const last = hits[hits.length - 1]
    wait = Math.max(wait, Math.ceil((last + cooldownSeconds * 1000 - now) / 1000))
  }
  return Math.max(0, wait)
}

// Call right BEFORE the request, so it counts even if the request fails
// (the SMS may already have been sent).
export function recordHit(key, windowSeconds) {
  const now = Date.now()
  const hits = readHits(key).filter((t) => now - t < windowSeconds * 1000)
  hits.push(now)
  try {
    localStorage.setItem(WIN_PREFIX + key, JSON.stringify(hits))
  } catch {
    // storage unavailable -- skip silently
  }
}

// 75 -> "1m 15s", 30 -> "30s"
export function formatWait(seconds) {
  const s = Math.max(0, Math.ceil(seconds))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}m ${r}s` : `${m}m`
}