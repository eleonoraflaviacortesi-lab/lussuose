import { useEffect, useRef } from 'react';

interface ArcaneParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
  spin: number;
  hue: number;
  phase: number;
  isSigil: boolean;
  sigilRotation: number;
  sigilLines: number;
}

export const FloatingSparkles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ArcaneParticle[]>([]);
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

    const count = Math.min(20, Math.floor(window.innerWidth / 80));
    particlesRef.current = Array.from({ length: count }, () => {
      const isSigil = Math.random() < 0.3;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: isSigil ? Math.random() * 6 + 4 : Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 0.25 + 0.05,
        speed: Math.random() * 0.2 + 0.05,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.008,
        hue: Math.random() < 0.7
          ? 250 + Math.random() * 30   // purple/indigo
          : 180 + Math.random() * 20,  // cyan
        phase: Math.random() * Math.PI * 2,
        isSigil,
        sigilRotation: Math.random() * Math.PI * 2,
        sigilLines: Math.floor(Math.random() * 3) + 4,
      };
    });

    let time = 0;
    const animate = () => {
      time += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        // Organic spiral movement
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed * 0.7 - p.speed * 0.3;
        p.angle += p.spin;
        p.sigilRotation += 0.003;

        // Wrap around
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        const pulse = Math.sin(time * 1.5 + p.phase) * 0.35 + 0.65;
        const alpha = p.opacity * pulse;

        if (p.isSigil) {
          // Draw arcane sigil
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.sigilRotation);
          ctx.globalAlpha = alpha * 0.6;

          // Outer circle
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${p.hue}, 70%, 55%, ${alpha * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Radial lines
          for (let i = 0; i < p.sigilLines; i++) {
            const a = (i / p.sigilLines) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
            ctx.strokeStyle = `hsla(${p.hue}, 60%, 65%, ${alpha * 0.4})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }

          ctx.restore();
        } else {
          // Glowing orb
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          gradient.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${alpha})`);
          gradient.addColorStop(0.5, `hsla(${p.hue}, 60%, 50%, ${alpha * 0.3})`);
          gradient.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Bright core
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(0, 0%, 100%, ${alpha * 0.6})`;
          ctx.fill();
        }
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
      style={{ opacity: 0.5 }}
      aria-hidden="true"
    />
  );
};
