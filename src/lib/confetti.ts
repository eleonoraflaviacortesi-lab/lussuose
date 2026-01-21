import confetti from 'canvas-confetti';

// Celebrazione standard per salvataggio report
export const celebrateSuccess = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });
};

// Stelline per obiettivo raggiunto
export const celebrateGoal = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors: ['#FFD700', '#FFC0CB', '#87CEEB', '#98FB98', '#DDA0DD'],
    shapes: ['star'],
    scalar: 1.2,
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: ReturnType<typeof setInterval> = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

// Mini celebrazione per incrementi positivi
export const celebrateMini = () => {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.8 },
    colors: ['#FFD700', '#98FB98', '#87CEEB'],
    scalar: 0.8,
    zIndex: 9999,
  });
};
