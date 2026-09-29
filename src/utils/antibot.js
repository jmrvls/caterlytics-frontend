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