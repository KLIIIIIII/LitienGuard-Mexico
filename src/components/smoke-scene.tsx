"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SmokeSceneImpl = dynamic(() => import("./smoke-scene-impl"), {
  ssr: false,
  loading: () => <SmokeFallback />,
});

function SmokeFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, rgba(45,62,80,0.08), transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(74,107,91,0.06), transparent 50%)",
      }}
    />
  );
}

export function SmokeScene() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reduced) return <SmokeFallback />;

  return (
    <div className="absolute inset-0" aria-hidden>
      <SmokeSceneImpl />
    </div>
  );
}
