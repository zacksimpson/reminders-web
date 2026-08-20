export function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// Textareas are replaced elements — the browser won't hand back a text
// offset for a point inside one. Stand up an invisible clone built from the
// same box/font metrics so caretRangeFromPoint can hit-test real text nodes,
// then map that back onto the textarea's selection.
export function placeCaretAtPoint(textarea: HTMLTextAreaElement, clientX: number, clientY: number) {
  const rect = textarea.getBoundingClientRect();
  const cs = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  mirror.textContent = textarea.value;
  Object.assign(mirror.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    padding: cs.padding,
    border: cs.border,
    boxSizing: cs.boxSizing,
    font: cs.font,
    letterSpacing: cs.letterSpacing,
    lineHeight: cs.lineHeight,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    overflow: "hidden",
    zIndex: "9999",
    opacity: "0.001",
  });
  document.body.appendChild(mirror);

  let offset = textarea.value.length;
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(clientX, clientY);
    if (range && mirror.contains(range.startContainer)) {
      offset = range.startContainer.nodeType === Node.TEXT_NODE ? range.startOffset : textarea.value.length;
    }
  } else if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(clientX, clientY);
    if (pos && mirror.contains(pos.offsetNode)) {
      offset = pos.offsetNode.nodeType === Node.TEXT_NODE ? pos.offset : textarea.value.length;
    }
  }

  document.body.removeChild(mirror);
  textarea.focus();
  textarea.setSelectionRange(offset, offset);
}
