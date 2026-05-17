"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Pull-to-refresh natif-like pour les pages bibliothèque.
// Actif quand l'utilisateur tire vers le bas alors qu'il est en haut du scroll.
// Au-dessus du seuil + relâche → router.refresh() (re-fetch server component).

const THRESHOLD = 70; // px de pull avant trigger
const MAX_PULL = 110; // amorti maximum visuel
const RESISTANCE = 0.5; // facteur d'amortissement

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let startY: number | null = null;
    let active = false;
    let currentDelta = 0;

    function onTouchStart(e: TouchEvent) {
      // Ne déclencher que si on est en haut du scroll.
      if (window.scrollY > 4) return;
      active = true;
      startY = e.touches[0].clientY;
      currentDelta = 0;
    }
    function onTouchMove(e: TouchEvent) {
      if (!active || startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        currentDelta = 0;
        setPullDistance(0);
        return;
      }
      currentDelta = Math.min(dy * RESISTANCE, MAX_PULL);
      setPullDistance(currentDelta);
      // Empêche le scroll natif tant qu'on tire vers le bas.
      if (dy > 12 && e.cancelable) e.preventDefault();
    }
    function onTouchEnd() {
      if (!active) return;
      active = false;
      if (currentDelta >= THRESHOLD) {
        setRefreshing(true);
        router.refresh();
        // Laisser un peu de temps visuel — router.refresh est rapide mais on
        // veut que le spinner soit perceptible.
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, 700);
      } else {
        setPullDistance(0);
      }
      currentDelta = 0;
      startY = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const visible = pullDistance > 0 || refreshing;

  return (
    <>
      <div
        aria-hidden={!visible}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          transform: `translateY(${refreshing ? THRESHOLD : pullDistance}px)`,
          opacity: refreshing ? 1 : progress,
          transition:
            refreshing || pullDistance > 0
              ? "none"
              : "transform 300ms ease, opacity 200ms ease",
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10">
          <svg
            className={refreshing ? "animate-spin" : ""}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${Math.min(progress * 360, 360)}deg)`,
            }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
      </div>
      {children}
    </>
  );
}
