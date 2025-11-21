/**
 * Confetti celebration utilities
 * Level 3 Premium UI
 */

import confetti from 'canvas-confetti';

// Sui-inspired colors
const SUI_COLORS = ['#4DA2FF', '#6FBCFF', '#06B6D4', '#22D3EE', '#14B8A6', '#10B981'];

/**
 * Success confetti - triggered when analysis completes successfully
 */
export function successConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors: SUI_COLORS,
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Since particles fall down, start a bit higher than random
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

/**
 * Blockchain confetti - triggered when blockchain attestation succeeds
 * More focused burst from center
 */
export function blockchainConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
    colors: SUI_COLORS,
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Quick burst confetti - for smaller successes
 */
export function quickBurst(origin?: { x: number; y: number }) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: origin || { x: 0.5, y: 0.5 },
    colors: SUI_COLORS,
    zIndex: 9999,
  });
}

/**
 * Fireworks effect - spectacular celebration
 */
export function fireworks() {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors: SUI_COLORS,
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.3, 0.7) }
    });
  }, 300);
}

/**
 * Stop all confetti animations
 */
export function stopConfetti() {
  confetti.reset();
}

