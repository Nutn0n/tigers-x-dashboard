"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#a855f7", "#f97316"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  w: number;
  h: number;
  rotation: number;
  vr: number;
  life: number;
};

function createParticles(count: number, width: number, height: number): Particle[] {
  const originX = width * 0.5;
  const originY = height * 0.38;
  return Array.from({ length: count }, () => ({
    x: originX + (Math.random() - 0.5) * width * 0.25,
    y: originY + (Math.random() - 0.5) * 40,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -16 - 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    life: 1,
  }));
}

export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (burstKey <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let particles = createParticles(180, canvas.width, canvas.height);
    const start = performance.now();
    const durationMs = 6000;

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += 0.22;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.life = Math.max(0, 1 - elapsed / durationMs);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < durationMs) {
        if (elapsed < 1200 && Math.random() < 0.08) {
          particles = particles.concat(
            createParticles(8, canvas.width, canvas.height),
          );
        }
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [burstKey]);

  if (burstKey <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden
    />
  );
}
