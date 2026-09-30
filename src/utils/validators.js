// Shared form validators so every screen applies the SAME rules.
// (Before this, Register required 8+ chars with a letter and a number,
// Settings only required 6, and the invite/reset page checked nothing.)

// PH mobile: 09171234567 or +639171234567 (spaces/dashes are ignored).
export function normalizePhMobile(value) {
  return String(value || '').replace(/[\s-]/g, '')
}

export function isValidPhMobile(value) {
  return /^(09\d{9}|\+639\d{9})$/.test(normalizePhMobile(value))
}

// Returns an error message, or '' when the password is acceptable.
export function validatePassword(password) {
  const p = String(password || '')
  if (p.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Password must contain at least one letter and one number.'
  return ''
}

// Images only (the file input's accept= can be bypassed by "All files").
export function validateImageFile(file, maxMb = 2) {
  if (!file) return ''
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return 'Please choose a PNG, JPG, or WEBP image.'
  if (file.size > maxMb * 1024 * 1024) return `Image must be ${maxMb}MB or smaller.`
  return ''
}