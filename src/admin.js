// ============================================
// MANIFESTO — Admin Dashboard
// ============================================

import { getAllUsers, getAllCashouts, updateCashoutStatus } from './store.js';

export const ADMIN_EMAILS = ['admin@gmail.com'];

export function isAdmin(user) {
  return user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export class AdminDashboard {
  constructor(container) {
    this.container = container;
    this.users = [];
    this.cashouts = [];
    this.currentTab = 'cashouts'; // 'cashouts' or 'users'
    this.isLoading = false;
    this.onExit = null;
  }

  async init() {
    this.isLoading = true;
    this.render();
    
    try {
      const [users, cashouts] = await Promise.all([
        getAllUsers(),
        getAllCashouts()
      ]);
      this.users = users;
      this.cashouts = cashouts;
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-container">
        <!-- Top bar -->
        <div class="tt-toolbar">
          <button class="tt-back-btn" id="admin-back-btn" title="Back to app">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>Exit Admin</span>
          </button>
          <div class="tt-brand">
            <span class="tt-brand-icon">👑</span>
            <span class="tt-brand-text">Admin Panel</span>
          </div>
          <div class="tt-spacer"></div>
        </div>

        <!-- Dashboard Content -->
        <div class="admin-dashboard-content">
          <div class="admin-tabs">
            <button class="admin-tab ${this.currentTab === 'cashouts' ? 'active' : ''}" data-tab="cashouts">Cashout Requests</button>
            <button class="admin-tab ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users">Users Economy</button>
          </div>

          <div class="admin-view-area">
            ${this.isLoading ? '<div class="admin-loading">Loading data...</div>' : 
              (this.currentTab === 'cashouts' ? this.renderCashouts() : this.renderUsers())}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderCashouts() {
    const now = Date.now();
    const visibleCashouts = this.cashouts.filter(c => {
      if (c.status === 'done' && c.doneAt && c.doneAt.toMillis) {
        const doneTime = c.doneAt.toMillis();
        if (now - doneTime > 2 * 60 * 1000) {
          return false; // hide if done more than 2 minutes ago
        }
      }
      return true;
    });

    if (visibleCashouts.length === 0) {
      return `<div class="admin-empty">No cashout requests found.</div>`;
    }

    const rows = visibleCashouts.map(c => {
      const date = c.requestedAt?.toDate?.() 
        ? c.requestedAt.toDate().toLocaleString('en-IN') 
        : 'Unknown Date';
      
      const statuses = ['pending', 'processing', 'approved', 'done', 'rejected'];
      const statusOptions = statuses.map(s => 
        `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s.toUpperCase()}</option>`
      ).join('');

      return `
        <tr>
          <td>
            <div class="admin-user-info">
              <span class="admin-email">${c.email || 'Unknown'}</span>
              <span class="admin-uid">${c.uid}</span>
            </div>
          </td>
          <td class="admin-amount">₹${(c.amount || 0).toFixed(2)}</td>
          <td class="admin-upi">${c.upiId || '-'}</td>
          <td>${date}</td>
          <td>
            <select class="admin-status-select" data-id="${c.id}">
              ${statusOptions}
            </select>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>UPI ID</th>
              <th>Date</th>
              <th>Status Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  renderUsers() {
    if (this.users.length === 0) {
      return `<div class="admin-empty">No users found.</div>`;
    }

    const rows = this.users.map(u => {
      const e = u.earnings || {};
      const totalWords = e.totalWords || 0;
      const totalEarnings = e.totalEarnings || 0;
      const date = e.lastUpdated ? new Date(e.lastUpdated).toLocaleDateString('en-IN') : '-';

      return `
        <tr>
          <td>
            <div class="admin-user-info">
              <span class="admin-email">${u.email || 'Unknown'}</span>
              <span class="admin-uid">${u.id}</span>
            </div>
          </td>
          <td>${totalWords.toLocaleString()}</td>
          <td class="admin-amount">₹${totalEarnings.toFixed(2)}</td>
          <td>${date}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Total Words</th>
              <th>Lifetime Earnings</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  attachEvents() {
    const backBtn = document.getElementById('admin-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.onExit) this.onExit();
      });
    }

    this.container.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.currentTab = e.target.dataset.tab;
        this.render();
      });
    });

    this.container.querySelectorAll('.admin-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const docId = e.target.dataset.id;
        const newStatus = e.target.value;
        const originalValue = this.cashouts.find(c => c.id === docId)?.status;

        // Visual loading state
        e.target.disabled = true;
        
        const success = await updateCashoutStatus(docId, newStatus);
        
        e.target.disabled = false;
        
        if (success) {
          // Update local state
          const cashout = this.cashouts.find(c => c.id === docId);
          if (cashout) {
            cashout.status = newStatus;
            if (newStatus === 'done') {
              cashout.doneAt = { toMillis: () => Date.now() };
            }
          }
          // Flash success
          e.target.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
          setTimeout(() => {
            e.target.style.backgroundColor = '';
            // If marked as done, re-render immediately to check 2-min rule (or just wait for next refresh)
            if (newStatus === 'done') this.render();
          }, 1000);
        } else {
          // Revert on failure
          e.target.value = originalValue;
          alert('Failed to update status. Check console.');
        }
      });
    });
  }
}
