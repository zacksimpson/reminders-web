import { LinkIcon } from "./icons";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

const styles = {
  chipRow: { marginTop: 4 },
  // No flex/inline-flex anywhere in this subtree: some browser builds don't
  // reliably respect text-decoration: none on a flex item, so an ancestor's
  // underline can still leak onto the flex item's own text even with none
  // set here explicitly. Laying out with vertical-align sidesteps that.
  chip: {
    display: "inline-block",
    verticalAlign: "middle",
    border: "1px solid #fff",
    padding: "1px 8px",
    marginRight: 6,
    marginBottom: 6,
    fontSize: 15,
    lineHeight: "20px",
    cursor: "pointer",
    textDecoration: "none",
  },
  icon: { display: "inline-block", verticalAlign: "middle", marginRight: 5 },
};

function shortenUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LinkChip({ url }: { url: string }) {
  return (
    <span
      role="link"
      style={styles.chip}
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      <span style={styles.icon}>
        <LinkIcon size={13} />
      </span>
      {shortenUrl(url)}
    </span>
  );
}

/** Renders the text with any http(s) URL pulled out into a small clickable
    chip underneath, showing just the domain, instead of a long raw link
    breaking up the sentence. */
export function LinkifiedText({ text }: { text: string }) {
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

  if (urls.length === 0) {
    return <>{text}</>;
  }

  const plainText = textSegments.map((s) => s.trim()).filter(Boolean).join(" ");

  return (
    <>
      {plainText && <div>{plainText}</div>}
      <div style={styles.chipRow}>
        {urls.map((url, i) => (
          <LinkChip key={i} url={url} />
        ))}
      </div>
    </>
  );
}
