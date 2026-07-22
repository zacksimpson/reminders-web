import { useEffect, useState } from "react";

const BREAKPOINT = 900;

export function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < BREAKPOINT);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isNarrow;
}
