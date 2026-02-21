const INVALID_FILENAME_CHARS = /[<>:"/\\|?*]/g;
const MULTIPLE_SPACES = /\s+/g;

function stripControlChars(value: string): string {
  return [...value].map((char) => (char.charCodeAt(0) <= 31 ? ' ' : char)).join('');
}

export function sanitizeFileName(input: string, fallback = 'conversation'): string {
  const normalized = stripControlChars(input)
    .trim()
    .replace(INVALID_FILENAME_CHARS, ' ')
    .replace(MULTIPLE_SPACES, ' ')
    .replace(/\.+$/g, '')
    .trim();

  if (normalized.length === 0 || /^\.+$/.test(normalized)) {
    return fallback;
  }

  return normalized;
}
