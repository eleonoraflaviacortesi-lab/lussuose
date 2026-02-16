import { useEffect, useRef } from 'react';

interface Trail {
  x: number;
  y: number;
  age: number;
  vx: number;
  vy: number;
}

export const MagicCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<Trail[]>([]);
  const sparksRef = useRef<Trail[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      trailRef.current.push({ x: e.clientX, y: e.clientY, age: 0, vx: 0, vy: 0 });
      if (trailRef.current.length > 30) trailRef.current.shift();

      // Spawn secondary sparks
      if (Math.random() < 0.3) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          age: 0,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        });
      }
    };

    window.addEventListener('mousemove', onMove);

    let time = 0;
    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      // Main trail
      trailRef.current.forEach((t) => {
        t.age += 0.035;
        const alpha = Math.max(0, 1 - t.age);
        if (alpha <= 0) return;

        const pulse = Math.sin(time * 3 + t.x * 0.01) * 0.3 + 1;
        const size = (1 - t.age) * 3.5 * pulse;

        // Purple-cyan gradient
        const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size * 2.5);
        gradient.addColorStop(0, `hsla(0, 0%, 100%, ${alpha * 0.4})`);
        gradient.addColorStop(0.3, `hsla(270, 80%, 55%, ${alpha * 0.5})`);
        gradient.addColorStop(0.7, `hsla(190, 90%, 50%, ${alpha * 0.2})`);
        gradient.addColorStop(1, `hsla(260, 80%, 40%, 0)`);

        ctx.beginPath();
        ctx.arc(t.x, t.y, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Secondary sparks
      sparksRef.current.forEach((s) => {
        s.age += 0.04;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;

        const alpha = Math.max(0, 1 - s.age);
        if (alpha <= 0) return;

        ctx.beginPath();
        ctx.arc(s.x, s.y, (1 - s.age) * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(260, 70%, 60%, ${alpha * 0.4})`;
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';

      trailRef.current = trailRef.current.filter(t => t.age < 1);
      sparksRef.current = sparksRef.current.filter(s => s.age < 1);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9990]"
      aria-hidden="true"
    />
  );
};
