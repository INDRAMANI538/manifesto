// ============================================
// MANIFESTO — Auth Page UI
// Premium glassmorphism login/signup page
// ============================================

/**
 * Render the full auth page HTML
 * @param {'login'|'signup'} mode
 * @param {string} errorMsg
 * @param {boolean} loading
 * @returns {string}
 */
export function renderAuthPage(mode = 'login', errorMsg = '', loading = false) {
  const isLogin = mode === 'login';

  return `
    <div class="auth-ambient">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon">
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="url(#auth-logo-grad)" stroke-width="2" fill="none" />
              <path d="M14 8l-5 3v6l5 3 5-3v-6l-5-3z" fill="url(#auth-logo-grad)" opacity="0.3" />
              <path d="M14 11l-3 1.8v3.4l3 1.8 3-1.8v-3.4l-3-1.8z" fill="url(#auth-logo-grad)" />
              <defs>
                <linearGradient id="auth-logo-grad" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#00d4ff" />
                  <stop offset="1" stop-color="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="auth-brand">MANIFESTO</h1>
          <p class="auth-tagline">Your Goal Command Center</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab ${isLogin ? 'active' : ''}" data-auth-mode="login" id="auth-tab-login">Login</button>
          <button class="auth-tab ${!isLogin ? 'active' : ''}" data-auth-mode="signup" id="auth-tab-signup">Sign Up</button>
        </div>

        ${errorMsg ? `<div class="auth-error" id="auth-error">${errorMsg}</div>` : ''}

        <form class="auth-form" id="auth-form" data-mode="${mode}">
          <div class="auth-field">
            <label class="auth-label" for="auth-email">Email</label>
            <input
              type="email"
              class="auth-input"
              id="auth-email"
              name="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              ${loading ? 'disabled' : ''}
            />
          </div>
          <div class="auth-field">
            <label class="auth-label" for="auth-password">Password</label>
            <input
              type="password"
              class="auth-input"
              id="auth-password"
              name="password"
              placeholder="${isLogin ? 'Enter your password' : 'Min 6 characters'}"
              required
              minlength="6"
              autocomplete="${isLogin ? 'current-password' : 'new-password'}"
              ${loading ? 'disabled' : ''}
            />
          </div>
          ${!isLogin ? `
          <div class="auth-field">
            <label class="auth-label" for="auth-password-confirm">Confirm Password</label>
            <input
              type="password"
              class="auth-input"
              id="auth-password-confirm"
              name="passwordConfirm"
              placeholder="Re-enter password"
              required
              minlength="6"
              autocomplete="new-password"
              ${loading ? 'disabled' : ''}
            />
          </div>
          ` : ''}
          <button type="submit" class="auth-submit ${loading ? 'loading' : ''}" id="auth-submit" ${loading ? 'disabled' : ''}>
            ${loading
              ? '<span class="auth-spinner"></span> Please wait...'
              : isLogin ? '🚀 Login' : '✨ Create Account'
            }
          </button>
        </form>

        <div class="auth-footer-text">
          ${isLogin
            ? "Don't have an account? <button class='auth-switch' data-auth-mode='signup'>Sign up</button>"
            : "Already have an account? <button class='auth-switch' data-auth-mode='login'>Login</button>"
          }
        </div>
      </div>
    </div>
  `;
}
