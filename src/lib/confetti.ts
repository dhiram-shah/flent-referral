import confetti from 'canvas-confetti';

const flentColors = ['#ff9a6d', '#93f2e9', '#ff90b3', '#ffe98a', '#dad7f4', '#cff0e9', '#ffa37b', '#008e75', '#332873'];

export function launchConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  // Initial big burst from both sides
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.15, y: 0.6 },
    colors: flentColors,
    startVelocity: 55,
    gravity: 0.8,
    ticks: 300,
    shapes: ['square', 'circle'],
    scalar: 1.1,
    angle: 60,
    drift: 0.5,
  });
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.85, y: 0.6 },
    colors: flentColors,
    startVelocity: 55,
    gravity: 0.8,
    ticks: 300,
    shapes: ['square', 'circle'],
    scalar: 1.1,
    angle: 120,
    drift: -0.5,
  });

  // Center cannon burst
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: flentColors,
      startVelocity: 45,
      gravity: 0.7,
      ticks: 250,
      shapes: ['square', 'circle'],
      scalar: 1.2,
    });
  }, 150);

  // Continuous shower
  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 3,
      spread: 60,
      origin: { x: Math.random(), y: -0.05 },
      colors: flentColors,
      startVelocity: 0,
      gravity: 0.6,
      ticks: 400,
      shapes: ['square'],
      scalar: 0.9,
      drift: (Math.random() - 0.5) * 1.5,
    });
  }, 50);

  // Stars burst at the end
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 360,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#ffe98a', '#ffa37b', '#ff90b3'],
      startVelocity: 30,
      gravity: 0.5,
      ticks: 200,
      shapes: ['star' as confetti.Shape],
      scalar: 1.5,
      flat: true,
    });
  }, 600);
}
