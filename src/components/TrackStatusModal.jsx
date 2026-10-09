import React, { useState } from 'react';
import { X, Search, CheckCircle2, Clock, AlertCircle, ShieldAlert, FileText, ArrowRight, Printer } from 'lucide-react';
import { api } from '../services/api';

export default function TrackStatusModal({ isOpen, onClose, onViewSlip }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setError('Please enter your Registration ID (e.g. SC-0001) or 10-digit Mobile Number.');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await api.trackApplication(cleanQuery);
      if (res && res.success && res.records && res.records.length > 0) {
        setResults(res.records);
      } else {
        setError(res.message || 'No application found with these details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Done':
        return (
          <span className="track-badge approved">
            <CheckCircle2 size={14} /> Approved for Installation
          </span>
        );
      case 'Verified':
        return (
          <span className="track-badge verified">
            <CheckCircle2 size={14} /> Documents Verified
          </span>
        );
      case 'Rejected':
        return (
          <span className="track-badge rejected">
            <ShieldAlert size={14} /> Rejected / Incomplete
          </span>
        );
      default:
        return (
          <span className="track-badge pending">
            <Clock size={14} /> Pending Office Review
          </span>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card track-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-icon-badge">
            <Search size={22} className="text-emerald" />
          </div>
          <h2 className="auth-title">Track Application Status</h2>
          <p className="auth-sub">
            Check the live office verification and subsidy status of your PM Surya Ghar application.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="track-search-form">
          <div className="track-input-group">
            <input
              type="text"
              className="track-input"
              placeholder="Enter Registration ID (e.g. SC-0001) or Mobile..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="track-search-btn" disabled={loading}>
              <Search size={16} />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="auth-error-alert animate-fade-in" style={{ marginTop: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Results List */}
        {results && results.length > 0 && (
          <div className="track-results-container animate-fade-in">
            {results.map((rec) => {
              const currentStatus = rec.verification?.status || 'Pending';
              return (
                <div key={rec._id || rec.registrationId} className="track-record-card">
                  <div className="trc-top">
                    <div>
                      <span className="trc-id font-mono">{rec.registrationId}</span>
                      <h3 className="trc-name">{rec.fullName}</h3>
                      <span className="trc-sub">
                        {rec.districtCity} • Consumer No: <span className="font-mono">{rec.consumerNo}</span>
                      </span>
                    </div>
                    <div>
                      {getStatusBadge(currentStatus)}
                    </div>
                  </div>

                  {/* Office Remarks Box */}
                  <div className="trc-remarks-box">
                    <span className="trc-remarks-label">Office Verification Decision:</span>
                    <p className="trc-remarks-text">
                      {rec.verification?.remarks ? rec.verification.remarks : 'Application received and queued for central discom officer verification.'}
                    </p>
                    {rec.verification?.verifiedAt && (
                      <span className="trc-remarks-date">
                        Updated on {new Date(rec.verification.verifiedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="trc-actions">
                    <button
                      type="button"
                      className="trc-slip-btn"
                      onClick={() => {
                        onClose();
                        onViewSlip(rec);
                      }}
                    >
                      <Printer size={15} />
                      <span>View & Print Acknowledgement Slip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
