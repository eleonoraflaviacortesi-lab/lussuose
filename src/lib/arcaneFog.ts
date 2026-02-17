const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="black"><path d="M50 0 L58 36 L85.36 14.64 L64 42 L100 50 L64 58 L85.36 85.36 L58 64 L50 100 L42 64 L14.64 85.36 L36 58 L0 50 L36 42 L14.64 14.64 L42 36 Z"/></svg>`;

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  swayPhase: number;
  swaySpeed: number;
}

export const triggerArcaneFog = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // No context = abort silently

    document.body.appendChild(canvas);

    const removeCanvas = () => {
      try { if (canvas.parentNode) canvas.remove(); } catch {}
    };

    // Hard safety: always remove after 5s no matter what
    const safetyTimeout = setTimeout(removeCanvas, 5000);

    const w = canvas.width;
    const h = canvas.height;

    const starImg = new Image();
    const blob = new Blob([STAR_SVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    let ready = false;

    starImg.onload = () => { ready = true; URL.revokeObjectURL(url); };
    starImg.onerror = () => {
      // SVG failed to load, clean up immediately
      URL.revokeObjectURL(url);
      clearTimeout(safetyTimeout);
      removeCanvas();
    };
    starImg.src = url;

    const stars: Star[] = [];
    const totalDuration = 3500;
    const spawnDuration = 2000;
    const startTime = performance.now();

    const spawnStar = (): Star => ({
      x: Math.random() * w,
      y: -30 - Math.random() * 60,
      size: 10 + Math.random() * 18,
      speed: 2.5 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      opacity: 0.6 + Math.random() * 0.4,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
    });

    for (let i = 0; i < 15; i++) stars.push(spawnStar());

    const animate = (now: number) => {
      const elapsed = now - startTime;

      // Force stop after totalDuration + buffer
      if (elapsed > totalDuration + 1000) {
        clearTimeout(safetyTimeout);
        removeCanvas();
        return;
      }

      if (elapsed > totalDuration && stars.every(s => s.y > h + 40)) {
        clearTimeout(safetyTimeout);
        removeCanvas();
        return;
      }

      ctx.clearRect(0, 0, w, h);

      if (elapsed < spawnDuration && Math.random() < 0.4) {
        stars.push(spawnStar());
      }

      let globalAlpha = 1;
      if (elapsed > totalDuration - 800) {
        globalAlpha = Math.max(0, 1 - (elapsed - (totalDuration - 800)) / 800);
      }

      if (!ready) {
        requestAnimationFrame(animate);
        return;
      }

      stars.forEach(s => {
        s.y += s.speed;
        s.x += Math.sin(s.swayPhase) * 0.8;
        s.swayPhase += s.swaySpeed;
        s.rotation += s.rotationSpeed;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = s.opacity * globalAlpha;
        ctx.drawImage(starImg, -s.size / 2, -s.size / 2, s.size, s.size);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } catch {
    // If anything goes wrong, fail silently
  }
};
