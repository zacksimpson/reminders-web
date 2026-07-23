import { useEffect, useState } from "react";

// Three panes need real room; below that, pair Lists+middle content and push
// the detail pane as its own screen; below that, even Lists+middle can't sit
// side by side, so everything stacks one screen at a time (phone-style).
const TABLET_BREAKPOINT = 1024;
const MOBILE_BREAKPOINT = 700;

export type LayoutTier = "desktop" | "tablet" | "mobile";

function computeTier(): LayoutTier {
  const w = window.innerWidth;
  if (w < MOBILE_BREAKPOINT) return "mobile";
  if (w < TABLET_BREAKPOINT) return "tablet";
  return "desktop";
}

export function useLayoutTier(): LayoutTier {
  const [tier, setTier] = useState<LayoutTier>(computeTier);

  useEffect(() => {
    const onResize = () => setTier(computeTier());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return tier;
}
