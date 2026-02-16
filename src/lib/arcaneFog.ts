const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

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

  // Pre-render star to offscreen canvas
  const starImg = new Image();
  const blob = new Blob([STAR_SVG], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  let ready = false;
  starImg.onload = () => { ready = true; URL.revokeObjectURL(url); };
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

  // Spawn initial batch
  for (let i = 0; i < 15; i++) stars.push(spawnStar());

  const animate = (now: number) => {
    const elapsed = now - startTime;
    if (elapsed > totalDuration && stars.every(s => s.y > h + 40)) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, w, h);

    // Spawn new stars during spawn phase
    if (elapsed < spawnDuration && Math.random() < 0.4) {
      stars.push(spawnStar());
    }

    // Fade out multiplier
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
};
