import { useEffect, useMemo, useState } from "react";

/** Ritorna "day" o "night" in base all'ora locale,
 *  con override via querystring ?mode=day|night
 */
export function useHeroTime() {
  const [mode, setMode] = useState<"day" | "night">("day");

  // override manuale per testing: ?mode=day|night
  const forced = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const p = new URLSearchParams(window.location.search);
    const m = p.get("mode");
    return m === "day" || m === "night" ? m : undefined;
  }, []);

  useEffect(() => {
    if (forced) {
      setMode(forced);
      return;
    }
    const compute = () => {
      const h = new Date().getHours();
      setMode(h >= 20 || h < 6 ? "night" : "day");
    };
    compute();
    const id = setInterval(compute, 60_000); // ricontrolla ogni minuto
    return () => clearInterval(id);
  }, [forced]);

  return mode;
}
