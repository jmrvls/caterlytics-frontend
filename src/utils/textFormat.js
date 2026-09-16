export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str
  return str
    .toLowerCase()
    .replace(/(^|\s|['-])\S/g, (letter) => letter.toUpperCase())
}