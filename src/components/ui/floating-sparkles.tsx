import { useEffect, useRef } from 'react';

interface Sparkle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  phase: number;
}

export const FloatingSparkles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Sparkle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
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

    // Create sparkles
    const count = Math.min(25, Math.floor(window.innerWidth / 60));
    sparklesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.3 + 0.1,
      drift: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));

    let time = 0;
    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparklesRef.current.forEach((s) => {
        s.y -= s.speed;
        s.x += Math.sin(time + s.phase) * s.drift;

        // Reset when off screen
        if (s.y < -10) {
          s.y = canvas.height + 10;
          s.x = Math.random() * canvas.width;
        }
        if (s.x < -10) s.x = canvas.width + 10;
        if (s.x > canvas.width + 10) s.x = -10;

        const pulse = Math.sin(time * 2 + s.phase) * 0.3 + 0.7;
        const alpha = s.opacity * pulse;

        // Draw a soft glowing dot
        const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
        gradient.addColorStop(0, `hsla(326, 80%, 55%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(326, 60%, 70%, ${alpha * 0.4})`);
        gradient.addColorStop(1, `hsla(326, 80%, 55%, 0)`);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 100%, ${alpha * 0.8})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
};
