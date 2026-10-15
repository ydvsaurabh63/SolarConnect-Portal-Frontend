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

  // Get Next Sequential Registration ID (rooted in Agent)
  async getNextId(agentCode = '') {
    try {
      const q = agentCode ? `?agentCode=${encodeURIComponent(agentCode)}` : '';
      const res = await fetch(`${API_BASE}/next-id${q}`);
      return await res.json();
    } catch (err) {
      return {
        success: true,
        nextId: 'SC-101-01-01-001',
        nextUserCode: 'USR-101-01-01-001',
        nextConsumerNo: 'CA-101-01-01-001',
      };
    }
  },

  // Auth: Sign In (Email / ConsumerNo / Mobile)
  async login(email, password = '', role = null) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return await res.json();
  },

  // Auth: Register User
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Hierarchy Users Management (Filter by role / createdById)
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.createdById) query.append('createdById', params.createdById);
    const res = await fetch(`${API_BASE}/users?${query.toString()}`);
    return await res.json();
  },

  // Create Subordinate User (Superadmin -> Admin -> Distributor -> Agent)
  async createUser(userData) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await res.json();
  },

  // Update User Details & Password (Full CRUD)
  async updateUser(id, userData) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await res.json();
  },

  // Reset or Update Consumer Password on user request
  async resetConsumerPassword(identifier, newPassword) {
    const res = await fetch(`${API_BASE}/users/reset-consumer-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, newPassword }),
    });
    return await res.json();
  },

  // Impersonate / "Login As" Subordinate User (Top-down only)
  async impersonateUser(targetUserId, requesterRole) {
    const res = await fetch(`${API_BASE}/auth/impersonate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, requesterRole }),
    });
    return await res.json();
  },

  // Delete User
  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
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

  // Update & Re-submit Registration (Agent Re-submission)
  async updateRegistration(id, data) {
    const res = await fetch(`${API_BASE}/registrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Upload Document / Photo to Cloudflare R2 (with fallback)
  async uploadFile(file, folder = 'documents') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
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

  // Get Submission Log with role-based filters
  async getSubmissionLog(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.agentId) query.append('agentId', params.agentId);
    if (params.distributorId) query.append('distributorId', params.distributorId);
    if (params.partnerId) query.append('partnerId', params.partnerId);
    if (params.installerId) query.append('installerId', params.installerId);

    const url = `${API_BASE}/submission-log?${query.toString()}`;
    const res = await fetch(url);
    return await res.json();
  },

  // Get single registration
  async getRegistration(id) {
    const res = await fetch(`${API_BASE}/registrations/${id}`);
    return await res.json();
  },

  // System Settings (Auto/Manual Mode & Mapping)
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, settings: { verificationMode: 'MANUAL', distributorPartnerMapping: {} } };
    }
  },

  async updateSettings(data) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Multi-Tier Verification: Distributor Check (Verify / Reject)
  async distributorVerify(id, data) {
    const res = await fetch(`${API_BASE}/registrations/${id}/distributor-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Multi-Tier Verification: Admin Check (Approve / Reject)
  async adminVerify(id, data) {
    const res = await fetch(`${API_BASE}/registrations/${id}/admin-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Workflow Action 1: Office/Admin Verification (Legacy)
  async verifyRegistration(id, status, remarks, verifiedBy = 'Operations Admin') {
    const res = await fetch(`${API_BASE}/registrations/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks, verifiedBy }),
    });
    return await res.json();
  },

  // Workflow Action 2: Admin Assigns Partner
  async assignPartner(id, partnerId, partnerName) {
    const res = await fetch(`${API_BASE}/registrations/${id}/assign-partner`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId, partnerName }),
    });
    return await res.json();
  },

  // Workflow Action 3: Partner Feasibility Check
  async partnerVerify(id, status, feasibilityNotes, documentAudits, rejectionReason, verifiedBy) {
    const res = await fetch(`${API_BASE}/registrations/${id}/partner-verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feasibilityNotes, documentAudits, rejectionReason, verifiedBy }),
    });
    return await res.json();
  },

  // Workflow Action 4: Financer Approval
  async financeVerify(id, status, loanAmount, remarks, financerId, financerName) {
    const res = await fetch(`${API_BASE}/registrations/${id}/finance-verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, loanAmount, remarks, financerId, financerName }),
    });
    return await res.json();
  },

  // Workflow Action 5: Partner Assigns Installer
  async assignInstaller(id, installerId, installerName, installerPhone) {
    const res = await fetch(`${API_BASE}/registrations/${id}/assign-installer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installerId, installerName, installerPhone }),
    });
    return await res.json();
  },

  // Workflow Action 6: Installer Completes Installation
  async installerComplete(id, serialNumbers, proofPhoto) {
    const res = await fetch(`${API_BASE}/registrations/${id}/installer-complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serialNumbers, proofPhoto }),
    });
    return await res.json();
  },

  // System Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await res.json();
  },

  // Live Track Application
  async trackApplication(query) {
    const res = await fetch(`${API_BASE}/registrations/track/${encodeURIComponent(query)}`);
    return await res.json();
  },
};
