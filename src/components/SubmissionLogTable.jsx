import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, Eye, Edit3, X, Check, Camera, Shield, FileCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function SubmissionLogTable({ onViewSlip, onBackToHome }) {
  const [logRecords, setLogRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, done: 0, docsComplete: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Office Verification modal state
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('Done');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logRes, statsRes] = await Promise.all([
        api.getSubmissionLog({ status: statusFilter, search: searchQuery }),
        api.getStats(),
      ]);

      if (logRes.success) {
        setLogRecords(logRes.submissionLog || []);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Error fetching submission log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleSaveVerification = async (e) => {
    e.preventDefault();
    if (!verifyModal) return;

    setActionLoading(true);
    try {
      const res = await api.verifyRegistration(
        verifyModal.registrationId || verifyModal._id,
        verifyStatus,
        verifyRemarks
      );
      if (res.success) {
        setVerifyModal(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="sublog-wrapper animate-fade-in">
      {/* Top Banner */}
      <div className="sublog-top-bar">
        <div className="sublog-title-area">
          <div className="booklet-badge">
            <FileText size={15} />
            <span>SOLARCONNECT FIELD REGISTRATION BOOKLET</span>
          </div>
          <h1 className="sublog-page-title">Digital Submission Log (SC-0001 to SC-0045)</h1>
          <p className="sublog-page-sub">
            Electronic master record equivalent to the paper Submission Log. Office verification desk for candidate registrations under PM Surya Ghar.
          </p>
        </div>

        <div className="sublog-actions">
          <button className="refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Sync Records</span>
          </button>
          <button className="exit-admin-btn" onClick={onBackToHome}>
            Exit to Registration Form
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="sublog-stats-grid">
        <div className="sublog-stat-card">
          <span className="sc-stat-label">Total Registered</span>
          <span className="sc-stat-val">{stats.total}</span>
          <span className="sc-stat-sub">Range: SC-0001 onwards</span>
        </div>

        <div className="sublog-stat-card border-amber">
          <span className="sc-stat-label">Pending Verification</span>
          <span className="sc-stat-val text-amber">{stats.pending}</span>
          <span className="sc-stat-sub">Awaiting office review</span>
        </div>

        <div className="sublog-stat-card border-green">
          <span className="sc-stat-label">Verified (Done)</span>
          <span className="sc-stat-val text-emerald">{stats.done}</span>
          <span className="sc-stat-sub">Eligibility checked</span>
        </div>

        <div className="sublog-stat-card border-blue">
          <span className="sc-stat-label">Docs & GPS OK</span>
          <span className="sc-stat-val text-blue">{stats.docsComplete}</span>
          <span className="sc-stat-sub">Complete documentation</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sublog-filter-row">
        <form onSubmit={handleSearchSubmit} className="sublog-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Reg. ID, Applicant Name, Mobile, Consumer No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit-btn">Search</button>
        </form>

        <div className="sublog-filter-box">
          <Filter size={15} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-dropdown"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      {/* Table matching Section 9 of the booklet */}
      <div className="sublog-table-card">
        {loading ? (
          <div className="table-loading-state">
            <RefreshCw size={24} className="animate-spin text-emerald" />
            <span>Loading Submission Log from Database...</span>
          </div>
        ) : logRecords.length === 0 ? (
          <div className="table-empty-state">
            <AlertCircle size={36} className="text-muted" />
            <h3>Submission Log is currently empty</h3>
            <p>Complete a Field Registration Form to see it cataloged in this log.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table booklet-log-table">
              <thead>
                <tr>
                  <th>Reg. ID</th>
                  <th>Applicant Name</th>
                  <th>Mobile Number</th>
                  <th>Consumer No.</th>
                  <th>Docs OK</th>
                  <th>GPS Photo</th>
                  <th>Sent On</th>
                  <th>Verification Status</th>
                  <th>Office Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logRecords.map((item) => (
                  <tr key={item._id || item.registrationId}>
                    <td className="font-mono font-bold text-slate">
                      {item.registrationId}
                    </td>

                    <td>
                      <strong className="applicant-name-bold">{item.applicantName}</strong>
                      <span className="applicant-area-sub">{item.districtCity}</span>
                    </td>

                    <td className="font-mono">{item.mobile}</td>

                    <td className="font-mono text-muted">{item.consumerNo || '—'}</td>

                    <td>
                      {item.docsOk ? (
                        <span className="badge-ok">
                          <Check size={12} /> OK
                        </span>
                      ) : (
                        <span className="badge-partial">Partial</span>
                      )}
                    </td>

                    <td>
                      {item.gpsPhoto ? (
                        <span className="badge-gps-ok">
                          <Camera size={12} /> Captured
                        </span>
                      ) : (
                        <span className="badge-missing">Missing</span>
                      )}
                    </td>

                    <td>
                      <span className="date-cell">
                        {new Date(item.sentOn).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td>
                      <span className={`status-pill status-${item.verificationStatus?.toLowerCase()}`}>
                        {item.verificationStatus}
                      </span>
                    </td>

                    <td>
                      <span className="remarks-cell">
                        {item.verificationRemarks || '—'}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="action-btn view-action"
                          onClick={() => onViewSlip(item.raw || item)}
                          title="View & Print Applicant Tear-Off Slip"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          className="action-btn edit-action"
                          onClick={() => {
                            setVerifyModal(item);
                            setVerifyStatus(item.verificationStatus || 'Done');
                            setVerifyRemarks(item.verificationRemarks || '');
                          }}
                          title="Office Verification: Mark Done & Add Remarks"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Office Verification Modal (Section 7) */}
      {verifyModal && (
        <div className="modal-overlay" onClick={() => setVerifyModal(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setVerifyModal(null)}>
              <X size={20} />
            </button>

            <div className="modal-header">
              <span className="badge-chip text-emerald">
                <FileCheck size={14} /> OFFICE VERIFICATION DESK
              </span>
              <h2 className="modal-title">Verify Registration {verifyModal.registrationId}</h2>
              <p className="modal-subtitle">Candidate: {verifyModal.applicantName} | Mobile: {verifyModal.mobile}</p>
            </div>

            <form onSubmit={handleSaveVerification} className="modal-form">
              <div className="form-group">
                <label className="form-label">Verification Status <span className="req">*</span></label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="Pending">Pending (Under Assessment)</option>
                  <option value="Done">Done (Verified & Eligible)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Office Remarks <span className="req">*</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter office review notes, DISCOM consumer verification, rooftop shadow observations..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn primary-glow-btn mt-4" disabled={actionLoading}>
                {actionLoading ? 'Updating Office Verification...' : 'Save Office Verification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
