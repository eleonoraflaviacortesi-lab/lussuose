import { useEffect, useRef } from 'react';

interface Trail {
  x: number;
  y: number;
  age: number;
}

export const MagicCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<Trail[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const animRef = useRef<number>(0);

  useEffect(() => {
    // Only on desktop with pointer
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
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
      trailRef.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trailRef.current.length > 20) trailRef.current.shift();
    };

    const onLeave = () => { mouseRef.current.active = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      trailRef.current.forEach((t, i) => {
        t.age += 0.04;
        const alpha = Math.max(0, 1 - t.age);
        if (alpha <= 0) return;

        const size = (1 - t.age) * 3;
        const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size * 2);
        gradient.addColorStop(0, `hsla(326, 80%, 60%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(326, 80%, 60%, 0)`);

        ctx.beginPath();
        ctx.arc(t.x, t.y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Remove dead trails
      trailRef.current = trailRef.current.filter(t => t.age < 1);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Don't render on touch devices
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
