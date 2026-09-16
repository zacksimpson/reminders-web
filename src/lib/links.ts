const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/g;
// Same pattern without the global flag, since reusing a global regex's own
// .test() across calls carries lastIndex state between them and gives wrong
// answers for later strings — matchAll below doesn't have that problem since
// it copies the regex internally instead of mutating the shared one.
const CONTAINS_URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

/** Whether text contains a link splitLinks would pull out into a chip. */
export function containsLink(text: string): boolean {
  return CONTAINS_URL_PATTERN.test(text);
}

/** Splits text into its plain-text content (URLs removed) and the list of
    URLs found, trimmed of trailing sentence punctuation they aren't part of. */
export function splitLinks(text: string): { plainText: string; urls: string[] } {
  const textSegments: string[] = [];
  const urls: string[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    let raw = match[0];
    const trailing = raw.match(TRAILING_PUNCTUATION);
    if (trailing) {
      raw = raw.slice(0, raw.length - trailing[0].length);
    }
    if (!raw) continue;
    textSegments.push(text.slice(lastIndex, start));
    urls.push(raw);
    lastIndex = start + raw.length;
  }
  textSegments.push(text.slice(lastIndex));

  return { plainText: textSegments.map((s) => s.trim()).filter(Boolean).join(" "), urls };
}
