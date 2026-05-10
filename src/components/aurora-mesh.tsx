"use client";

import { useEffect, useState } from "react";

export function AuroraMesh() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`aurora-stage ${reduced ? "aurora-static" : ""}`}>
        <span className="aurora-blob aurora-blob-a" />
        <span className="aurora-blob aurora-blob-b" />
        <span className="aurora-blob aurora-blob-c" />
        <span className="aurora-blob aurora-blob-d" />
        <span className="aurora-blob aurora-blob-e" />
        <span className="aurora-blob aurora-blob-f" />
      </div>
      <div className="aurora-glass" />

      <style jsx>{`
        .aurora-stage {
          position: absolute;
          inset: -25%;
          pointer-events: none;
        }
        .aurora-blob {
          position: absolute;
          display: block;
          border-radius: 50%;
          filter: blur(38px);
          opacity: 0;
          will-change: transform, opacity;
        }
        .aurora-blob-a {
          width: 42vw;
          height: 42vw;
          left: -10vw;
          top: -12vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(74, 107, 91, 0.88),
            rgba(74, 107, 91, 0) 65%
          );
          animation:
            aurora-fade 1.6s ease-out forwards,
            aurora-drift-a 16s ease-in-out 1.6s infinite;
        }
        .aurora-blob-b {
          width: 38vw;
          height: 38vw;
          right: -12vw;
          top: -6vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(45, 62, 80, 0.78),
            rgba(45, 62, 80, 0) 65%
          );
          animation:
            aurora-fade 1.8s ease-out forwards,
            aurora-drift-b 19s ease-in-out 1.8s infinite;
        }
        .aurora-blob-c {
          width: 36vw;
          height: 36vw;
          left: 6vw;
          bottom: -16vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(139, 107, 58, 0.62),
            rgba(139, 107, 58, 0) 65%
          );
          animation:
            aurora-fade 2.2s ease-out forwards,
            aurora-drift-c 17s ease-in-out 2.2s infinite;
        }
        .aurora-blob-d {
          width: 32vw;
          height: 32vw;
          right: 4vw;
          bottom: -10vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(74, 107, 91, 0.72),
            rgba(74, 107, 91, 0) 65%
          );
          animation:
            aurora-fade 2.4s ease-out forwards,
            aurora-drift-d 14s ease-in-out 2.4s infinite;
        }
        .aurora-blob-e {
          width: 28vw;
          height: 28vw;
          left: 32vw;
          top: -8vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(45, 62, 80, 0.58),
            rgba(45, 62, 80, 0) 65%
          );
          animation:
            aurora-fade 2.6s ease-out forwards,
            aurora-drift-e 21s ease-in-out 2.6s infinite;
        }
        .aurora-blob-f {
          width: 30vw;
          height: 30vw;
          right: 28vw;
          bottom: 8vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(74, 107, 91, 0.55),
            rgba(74, 107, 91, 0) 65%
          );
          animation:
            aurora-fade 2.8s ease-out forwards,
            aurora-drift-f 18s ease-in-out 2.8s infinite;
        }

        /* Frosted glass / vidrio templado encima de la aurora */
        .aurora-glass {
          position: absolute;
          inset: 0;
          background: rgba(251, 250, 246, 0.3);
          backdrop-filter: blur(36px) saturate(1.4);
          -webkit-backdrop-filter: blur(36px) saturate(1.4);
          pointer-events: none;
        }

        .aurora-static .aurora-blob {
          animation: aurora-fade 1s ease-out forwards;
          opacity: 1;
        }

        @keyframes aurora-fade {
          to {
            opacity: 1;
          }
        }
        @keyframes aurora-drift-a {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(11vw, 5vw, 0) scale(1.12);
          }
          50% {
            transform: translate3d(7vw, 12vw, 0) scale(1.18);
          }
          75% {
            transform: translate3d(-3vw, 8vw, 0) scale(1.06);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-b {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(-10vw, 7vw, 0) scale(1.18);
          }
          50% {
            transform: translate3d(-4vw, 13vw, 0) scale(1.1);
          }
          75% {
            transform: translate3d(2vw, 6vw, 0) scale(1.04);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-c {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(8vw, -6vw, 0) scale(1.1);
          }
          50% {
            transform: translate3d(13vw, -3vw, 0) scale(1.15);
          }
          75% {
            transform: translate3d(5vw, -10vw, 0) scale(1.06);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-d {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(-7vw, -5vw, 0) scale(1.08);
          }
          50% {
            transform: translate3d(-11vw, -9vw, 0) scale(1.14);
          }
          75% {
            transform: translate3d(-3vw, -4vw, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-e {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(-5vw, 9vw, 0) scale(1.12);
          }
          50% {
            transform: translate3d(6vw, 14vw, 0) scale(1.2);
          }
          75% {
            transform: translate3d(4vw, 5vw, 0) scale(1.06);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-f {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(6vw, -8vw, 0) scale(1.1);
          }
          50% {
            transform: translate3d(-7vw, -12vw, 0) scale(1.16);
          }
          75% {
            transform: translate3d(-4vw, -3vw, 0) scale(1.04);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-blob {
            animation: aurora-fade 1s ease-out forwards !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
