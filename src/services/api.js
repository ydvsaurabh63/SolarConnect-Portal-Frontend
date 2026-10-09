const API_BASE = 'http://localhost:4000/api';

export const api = {
  // Check backend connection
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err) {
      console.warn('Backend is unreachable:', err);
      return { status: 'offline', database: 'Offline' };
    }
  },

  // Get Next Sequential Registration ID (SC-0001 format)
  async getNextId() {
    try {
      const res = await fetch(`${API_BASE}/next-id`);
      return await res.json();
    } catch (err) {
      return { success: true, nextId: 'SC-0001' };
    }
  },

  // Auth: User Registration (New Account)
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Auth: User Sign In
  async login(email, password = '') {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  },

  // Submit Digital Registration Form (Booklet Form)
  async submitRegistration(data) {
    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Quick Connection Lead from Landing Page
  async quickConnection(data) {
    const res = await fetch(`${API_BASE}/quick-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Get Submission Log (Booklet Submission Log Table)
  async getSubmissionLog(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const url = `${API_BASE}/submission-log?${query.toString()}`;
    const res = await fetch(url);
    return await res.json();
  },

  // Get single registration (For Tear-Off Slip / View Details)
  async getRegistration(id) {
    const res = await fetch(`${API_BASE}/registrations/${id}`);
    return await res.json();
  },

  // Office Verification (Pending -> Done + Remarks)
  async verifyRegistration(id, status, remarks, verifiedBy = 'Office Officer') {
    const res = await fetch(`${API_BASE}/registrations/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks, verifiedBy }),
    });
    return await res.json();
  },

  // System Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await res.json();
  },

  // Live Track Application (By Mobile or Registration ID)
  async trackApplication(query) {
    const res = await fetch(`${API_BASE}/registrations/track/${encodeURIComponent(query)}`);
    return await res.json();
  },
};
