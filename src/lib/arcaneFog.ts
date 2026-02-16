interface FogParticle {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  velocity: number;
  hue: number;
  opacity: number;
  maxOpacity: number;
}

interface Flash {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  triggered: boolean;
  triggerTime: number;
}

export const triggerArcaneFog = () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Create fog particles
  const particles: FogParticle[] = Array.from({ length: 18 }, () => {
    const hues = [260, 265, 270, 275, 240, 190, 195];
    return {
      x: w * 0.3 + Math.random() * w * 0.4,
      y: h * 0.3 + Math.random() * h * 0.4,
      radius: 10 + Math.random() * 30,
      maxRadius: 150 + Math.random() * 250,
      velocity: 1.5 + Math.random() * 2.5,
      hue: hues[Math.floor(Math.random() * hues.length)],
      opacity: 0,
      maxOpacity: 0.15 + Math.random() * 0.2,
    };
  });

  // Mystic flashes
  const flashes: Flash[] = [
    { x: w * 0.4, y: h * 0.35, radius: 0, opacity: 0, triggered: false, triggerTime: 800 },
    { x: w * 0.6, y: h * 0.55, radius: 0, opacity: 0, triggered: false, triggerTime: 1600 },
    { x: w * 0.5, y: h * 0.45, radius: 0, opacity: 0, triggered: false, triggerTime: 2400 },
  ];

  const startTime = performance.now();
  const totalDuration = 3500;
  const fadeOutStart = 2200;

  const animate = (now: number) => {
    const elapsed = now - startTime;
    if (elapsed > totalDuration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, w, h);

    // Global fade multiplier
    let globalAlpha = 1;
    if (elapsed < 400) {
      globalAlpha = elapsed / 400;
    } else if (elapsed > fadeOutStart) {
      globalAlpha = 1 - (elapsed - fadeOutStart) / (totalDuration - fadeOutStart);
    }

    // Draw fog particles
    particles.forEach(p => {
      if (p.radius < p.maxRadius) {
        p.radius += p.velocity;
      }
      p.opacity = Math.min(p.opacity + 0.008, p.maxOpacity);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      const a = p.opacity * globalAlpha;
      grad.addColorStop(0, `hsla(${p.hue}, 60%, 15%, ${a})`);
      grad.addColorStop(0.5, `hsla(${p.hue}, 50%, 10%, ${a * 0.6})`);
      grad.addColorStop(1, `hsla(${p.hue}, 40%, 5%, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Draw flashes
    flashes.forEach(f => {
      if (elapsed >= f.triggerTime && !f.triggered) {
        f.triggered = true;
        f.opacity = 0.6;
        f.radius = 20;
      }
      if (f.triggered && f.opacity > 0) {
        f.radius += 8;
        f.opacity *= 0.92;

        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        const a = f.opacity * globalAlpha;
        grad.addColorStop(0, `hsla(270, 70%, 70%, ${a})`);
        grad.addColorStop(0.4, `hsla(260, 60%, 40%, ${a * 0.4})`);
        grad.addColorStop(1, `hsla(250, 50%, 20%, 0)`);

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    });

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
};
