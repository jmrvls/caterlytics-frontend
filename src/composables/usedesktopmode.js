import { ref } from 'vue'

// The width (in CSS px) our desktop layout is designed around.
// This matches Tailwind's `lg` breakpoint (1024px) with a little
// breathing room so the sidebar + content don't feel cramped.
const DESKTOP_WIDTH = 1280
const STORAGE_KEY = 'caterlytics-desktop-mode'

const isDesktopMode = ref(localStorage.getItem(STORAGE_KEY) === '1')

function getViewportMeta() {
  return document.querySelector('meta[name="viewport"]')
}

function applyViewport() {
  const meta = getViewportMeta()
  if (!meta) return

  if (isDesktopMode.value) {
    // Tell the phone's browser the page is DESKTOP_WIDTH px wide, then
    // zoom the whole layout viewport out so it fits the real screen.
    // This is the same trick "Request Desktop Site" uses in Chrome/Safari.
    const scale = window.innerWidth / DESKTOP_WIDTH
    meta.setAttribute(
      'content',
      `width=${DESKTOP_WIDTH}, initial-scale=${scale}, minimum-scale=${scale}, user-scalable=yes`
    )
  } else {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0')
  }
}

function handleResize() {
  if (isDesktopMode.value) applyViewport()
}

let listenerAttached = false

export function useDesktopMode() {
  if (!listenerAttached) {
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    listenerAttached = true
    // Re-apply immediately in case the user had it on from a previous visit.
    applyViewport()
  }

  function setDesktopMode(value) {
    isDesktopMode.value = value
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    applyViewport()
  }

  function toggleDesktopMode() {
    setDesktopMode(!isDesktopMode.value)
  }

  return {
    isDesktopMode,
    setDesktopMode,
    toggleDesktopMode,
  }
}