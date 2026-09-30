export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str
  return str
    .toLowerCase()
    // Capitalise the first letter of each word / hyphen part. After an
    // apostrophe only capitalise when a longer name follows (O'Brien,
    // D'Angelo) -- NOT for possessives/contractions ("Mary's", "Don't"),
    // which used to come out as "Mary'S".
    .replace(/(^|\s|-)\S/g, (letter) => letter.toUpperCase())
    .replace(/(['\u2019])(\w)(?=\w)/g, (_, apos, letter) => apos + letter.toUpperCase())
}