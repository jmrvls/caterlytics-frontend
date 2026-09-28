import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// SESSION-BASED LOGIN: by default supabase-js saves the login token in
// localStorage, which survives closing the browser -- so the user stays
// logged in "forever". Pointing it at sessionStorage makes the login live
// only for the current browser tab/session: close the tab or browser and
// the user has to log in again. This also matches the rest of the app,
// which already caches the user in sessionStorage.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// One-time cleanup: remove the old token that earlier versions left in
// localStorage, so nobody stays logged in from the previous behavior.
// Only touches Supabase's auth-token keys; theme/desktop-mode settings
// are left alone.
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    .forEach((k) => localStorage.removeItem(k))
} catch {
  // localStorage unavailable -- nothing to clean up.
}