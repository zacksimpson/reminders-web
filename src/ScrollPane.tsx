import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";

// Matches hooks/useScrollIndicator.ts in the phone app: a thin always-visible
// track plus a proportionally-sized thumb, replacing the native scrollbar.
const MIN_THUMB = 24;
const TRACK_RIGHT = 18;

type Thumb = { height: number; top: number };

function computeThumb(el: HTMLDivElement): Thumb | null {
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight + 1) {
    return null;
  }
  const height = Math.max((clientHeight * clientHeight) / scrollHeight, MIN_THUMB);
  const maxTop = clientHeight - height;
  const top = maxTop * (scrollTop / (scrollHeight - clientHeight));
  return { height, top };
}

export function ScrollPane({
  style,
  outerStyle,
  children,
}: {
  style?: CSSProperties;
  outerStyle?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = computeThumb(el);
    setThumb((prev) =>
      prev?.height === next?.height && prev?.top === next?.top ? prev : next
    );
  });

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const next = computeThumb(el);
    setThumb((prev) =>
      prev?.height === next?.height && prev?.top === next?.top ? prev : next
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 0, ...outerStyle }}>
      <div
        ref={ref}
        className="scroll-hide"
        style={{ ...style, height: "100%", overflowY: "auto" }}
        onScroll={onScroll}
      >
        {children}
      </div>
      {thumb && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: TRACK_RIGHT,
            width: 1,
            background: "#fff",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: thumb.top,
              right: -2,
              width: 5,
              height: thumb.height,
              background: "#fff",
            }}
          />
        </div>
      )}
    </div>
  );
}
