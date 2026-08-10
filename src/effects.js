// ============================================
// MANIFESTO — Visual Juice Engine
// Particle bursts, combo counters, heat mode aura
// ============================================

// Spawn glowing particles at key/cursor location
export function spawnParticleBurst(x, y, color = '#00d4ff', count = 8) {
  const container = document.body;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'fx-particle';

    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 50;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = 4 + Math.random() * 6;

    p.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 8px ${color};
      transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease;
      opacity: 1;
    `;

    container.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(${vx}px, ${vy}px) scale(0)`;
      p.style.opacity = '0';
    });

    setTimeout(() => p.remove(), 450);
  }
}

// Float combo text (+10 COMBO!)
export function showComboToast(text, color = '#ff007f') {
  let toast = document.getElementById('fx-combo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fx-combo-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="fx-combo-text" style="color:${color}">${text}</span>`;
  toast.className = 'fx-combo-pop';

  setTimeout(() => {
    toast.className = '';
  }, 600);
}

// Shake container on error
export function shakeElement(el) {
  if (!el) return;
  el.classList.add('fx-shake');
  setTimeout(() => el.classList.remove('fx-shake'), 350);
}
