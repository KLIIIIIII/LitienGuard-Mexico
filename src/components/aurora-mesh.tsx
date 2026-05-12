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
        <span className="aurora-blob aurora-blob-g" />
        <span className="aurora-blob aurora-blob-h" />
        <span className="aurora-blob aurora-blob-i" />
        <span className="aurora-blob aurora-blob-j" />
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
          filter: blur(48px);
          /*
           * iOS Safari bug: animation sobre elementos con filter:blur
           * puede no disparar y dejarlos atrapados en el estado from.
           * Iniciamos opacity:1 directo — el keyframe aurora-fade
           * desaparece como "ease-in" (de invisible a visible) pero si
           * no corre, los blobs siguen visibles igual.
           */
          opacity: 1;
          will-change: transform;
        }

        /* Validation green — más saturado */
        .aurora-blob-a {
          width: 44vw;
          height: 44vw;
          left: -10vw;
          top: -12vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(74, 107, 91, 1),
            rgba(74, 107, 91, 0) 65%
          );
          animation: aurora-drift-a 14s ease-in-out infinite;
        }
        /* Deep slate blue */
        .aurora-blob-b {
          width: 40vw;
          height: 40vw;
          right: -12vw;
          top: -6vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(45, 62, 95, 0.95),
            rgba(45, 62, 95, 0) 65%
          );
          animation: aurora-drift-b 17s ease-in-out infinite;
        }
        /* Warm amber */
        .aurora-blob-c {
          width: 38vw;
          height: 38vw;
          left: 6vw;
          bottom: -16vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(180, 135, 70, 0.82),
            rgba(180, 135, 70, 0) 65%
          );
          animation: aurora-drift-c 15s ease-in-out infinite;
        }
        /* Teal */
        .aurora-blob-d {
          width: 34vw;
          height: 34vw;
          right: 4vw;
          bottom: -10vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(60, 120, 115, 0.9),
            rgba(60, 120, 115, 0) 65%
          );
          animation: aurora-drift-d 12s ease-in-out infinite;
        }
        /* Slate blue accent */
        .aurora-blob-e {
          width: 30vw;
          height: 30vw;
          left: 32vw;
          top: -8vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(70, 90, 130, 0.85),
            rgba(70, 90, 130, 0) 65%
          );
          animation: aurora-drift-e 19s ease-in-out infinite;
        }
        /* Forest green */
        .aurora-blob-f {
          width: 32vw;
          height: 32vw;
          right: 28vw;
          bottom: 8vw;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(90, 130, 105, 0.78),
            rgba(90, 130, 105, 0) 65%
          );
          animation: aurora-drift-f 16s ease-in-out infinite;
        }
        /* Soft rose */
        .aurora-blob-g {
          width: 28vw;
          height: 28vw;
          left: 20vw;
          top: 30vh;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(165, 105, 110, 0.65),
            rgba(165, 105, 110, 0) 65%
          );
          animation: aurora-drift-g 18s ease-in-out infinite;
        }
        /* Dusty plum */
        .aurora-blob-h {
          width: 26vw;
          height: 26vw;
          right: 18vw;
          top: 25vh;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(110, 85, 130, 0.62),
            rgba(110, 85, 130, 0) 65%
          );
          animation: aurora-drift-h 20s ease-in-out infinite;
        }
        /* Soft gold */
        .aurora-blob-i {
          width: 24vw;
          height: 24vw;
          left: 45vw;
          bottom: 25vh;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(195, 165, 95, 0.7),
            rgba(195, 165, 95, 0) 65%
          );
          animation: aurora-drift-i 13s ease-in-out infinite;
        }
        /* Validation soft accent — center */
        .aurora-blob-j {
          width: 36vw;
          height: 36vw;
          left: 25vw;
          top: 35vh;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(120, 160, 140, 0.55),
            rgba(120, 160, 140, 0) 65%
          );
          animation: aurora-drift-j 22s ease-in-out infinite;
        }

        /* Frosted glass más translúcido para dejar ver más la aurora */
        .aurora-glass {
          position: absolute;
          inset: 0;
          background: rgba(251, 250, 246, 0.18);
          backdrop-filter: blur(24px) saturate(1.55);
          -webkit-backdrop-filter: blur(24px) saturate(1.55);
          pointer-events: none;
        }

        .aurora-static .aurora-blob {
          animation: none;
          opacity: 1;
        }
        @keyframes aurora-drift-a {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(15vw, 7vw, 0) scale(1.22);
          }
          50% {
            transform: translate3d(10vw, 16vw, 0) scale(1.3);
          }
          75% {
            transform: translate3d(-4vw, 11vw, 0) scale(1.12);
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
            transform: translate3d(-13vw, 9vw, 0) scale(1.28);
          }
          50% {
            transform: translate3d(-6vw, 17vw, 0) scale(1.2);
          }
          75% {
            transform: translate3d(3vw, 8vw, 0) scale(1.08);
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
            transform: translate3d(11vw, -8vw, 0) scale(1.2);
          }
          50% {
            transform: translate3d(17vw, -4vw, 0) scale(1.28);
          }
          75% {
            transform: translate3d(6vw, -13vw, 0) scale(1.12);
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
            transform: translate3d(-9vw, -7vw, 0) scale(1.18);
          }
          50% {
            transform: translate3d(-14vw, -12vw, 0) scale(1.26);
          }
          75% {
            transform: translate3d(-4vw, -5vw, 0) scale(1.1);
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
            transform: translate3d(-7vw, 12vw, 0) scale(1.22);
          }
          50% {
            transform: translate3d(8vw, 18vw, 0) scale(1.3);
          }
          75% {
            transform: translate3d(5vw, 7vw, 0) scale(1.1);
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
            transform: translate3d(8vw, -10vw, 0) scale(1.2);
          }
          50% {
            transform: translate3d(-9vw, -16vw, 0) scale(1.28);
          }
          75% {
            transform: translate3d(-5vw, -4vw, 0) scale(1.08);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-g {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(10vw, -6vw, 0) scale(1.2);
          }
          50% {
            transform: translate3d(-5vw, -11vw, 0) scale(1.26);
          }
          75% {
            transform: translate3d(-12vw, 3vw, 0) scale(1.12);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-h {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(-9vw, 8vw, 0) scale(1.18);
          }
          50% {
            transform: translate3d(4vw, 14vw, 0) scale(1.24);
          }
          75% {
            transform: translate3d(11vw, -3vw, 0) scale(1.1);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-i {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(-8vw, -10vw, 0) scale(1.2);
          }
          50% {
            transform: translate3d(8vw, -16vw, 0) scale(1.28);
          }
          75% {
            transform: translate3d(13vw, -4vw, 0) scale(1.1);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes aurora-drift-j {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(7vw, 11vw, 0) scale(1.22);
          }
          50% {
            transform: translate3d(-9vw, 6vw, 0) scale(1.18);
          }
          75% {
            transform: translate3d(-4vw, -8vw, 0) scale(1.12);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-blob {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        /*
         * Mobile fix: iOS Safari sobrecarga GPU con 10 blobs × blur(48px)
         * + backdrop-filter saturate. Resultado: blobs no se renderizan
         * y solo queda visible el glass overlay como color uniforme.
         * Aquí (≤768px) reducimos carga manteniendo el espíritu visual.
         */
        @media (max-width: 768px) {
          .aurora-blob {
            filter: blur(28px);
          }
          /* Mantenemos solo los 6 más vibrantes en mobile */
          .aurora-blob-g,
          .aurora-blob-h,
          .aurora-blob-i,
          .aurora-blob-j {
            display: none;
          }
          .aurora-glass {
            background: rgba(251, 250, 246, 0.12);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }
      `}</style>
    </div>
  );
}
