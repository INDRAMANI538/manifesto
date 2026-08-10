// ============================================
// MANIFESTO — Animations
// Confetti, counters, and micro-interactions
// ============================================

import confetti from 'canvas-confetti';

/**
 * Fire a celebratory confetti burst when a goal is completed
 */
export function celebrateGoalComplete() {
  // Main burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ec4899'],
    ticks: 150,
    gravity: 1.2,
    scalar: 1.1,
    shapes: ['circle', 'square'],
  });

  // Side bursts with delay
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#00d4ff', '#7c3aed'],
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#10b981', '#ec4899'],
    });
  }, 150);
}

/**
 * Animate a number counting up
 */
export function animateCounter(element, targetValue, duration = 600) {
  const start = parseInt(element.textContent) || 0;
  const diff = targetValue - start;
  if (diff === 0) {
    element.textContent = targetValue;
    return;
  }

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(start + diff * eased);
    element.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = targetValue;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Animate a progress bar fill
 */
export function animateProgressBar(element, percentage) {
  // Small delay to allow DOM render
  requestAnimationFrame(() => {
    element.style.width = `${percentage}%`;
  });
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/**
 * Small haptic-like pulse on an element
 */
export function pulseElement(element) {
  element.style.transition = 'transform 100ms ease';
  element.style.transform = 'scale(0.95)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
}
