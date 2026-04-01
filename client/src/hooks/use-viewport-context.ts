import { useState, useEffect, useMemo } from "react";

export type ViewportContext = "one-handed" | "two-handed" | "tablet" | "desktop";

const BREAKPOINTS = {
  twoHanded: 429,
  tablet: 835,
  desktop: 1280,
} as const;

function getContext(width: number): ViewportContext {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  if (width >= BREAKPOINTS.twoHanded) return "two-handed";
  return "one-handed";
}

export function useViewportContext(): ViewportContext {
  const [context, setContext] = useState<ViewportContext>(() =>
    typeof window !== "undefined" ? getContext(window.innerWidth) : "one-handed"
  );

  useEffect(() => {
    const handleResize = () => {
      setContext(getContext(window.innerWidth));
    };

    const mqTablet = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`);
    const mqTwoHanded = window.matchMedia(`(min-width: ${BREAKPOINTS.twoHanded}px)`);
    const mqDesktop = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`);

    const onChange = () => handleResize();
    mqTablet.addEventListener("change", onChange);
    mqTwoHanded.addEventListener("change", onChange);
    mqDesktop.addEventListener("change", onChange);

    handleResize();

    return () => {
      mqTablet.removeEventListener("change", onChange);
      mqTwoHanded.removeEventListener("change", onChange);
      mqDesktop.removeEventListener("change", onChange);
    };
  }, []);

  return context;
}

export function useIsOneHanded(): boolean {
  return useViewportContext() === "one-handed";
}

export function useIsMobileContext(): boolean {
  const ctx = useViewportContext();
  return ctx === "one-handed" || ctx === "two-handed";
}

export function useIsTabletOrAbove(): boolean {
  const ctx = useViewportContext();
  return ctx === "tablet" || ctx === "desktop";
}

export function useIsDesktop(): boolean {
  return useViewportContext() === "desktop";
}
