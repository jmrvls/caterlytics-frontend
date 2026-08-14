// Small utility for the light/dark mode toggle (Settings page).
// Applies a 'dark' class to <html> (Tailwind darkMode: 'class') and
// remembers the choice in localStorage so it persists across visits.
const STORAGE_KEY = 'caterlytics_theme';

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'light';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

// Call once on app startup so the correct theme is active before the
// first paint (avoids a light->dark flash on reload).
export function initTheme() {
  applyTheme(getStoredTheme());
}