import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sun,
  CheckCircle2,
  Clock,
  Wrench,
  Banknote,
  FileText,
  UserCheck,
  ShieldCheck,
  Phone,
  MapPin,
  Download,
  LogOut,
  Home,
  AlertCircle,
  ExternalLink,
  Upload,
  XCircle,
} from 'lucide-react';
import TearOffSlip from '../components/TearOffSlip';

export default function ConsumerDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Document correction states
  const [correctedDocs, setCorrectedDocs] = useState({});
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState('');
  const [correctionError, setCorrectionError] = useState('');

  const handleConsumerFileUpload = async (docKey, file) => {
    if (!file) return;
    try {
      let finalUrl = '';
      try {
        const res = await api.uploadFile(file, `consumer-${docKey}`);
        if (res && res.success && res.fileUrl) finalUrl = res.fileUrl;
      } catch (e) {}

      if (!finalUrl) {
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      setCorrectedDocs((prev) => ({
        ...prev,
        [docKey]: {
          ...(appData.documents?.[docKey] || {}),
          fileUrl: finalUrl,
          fileName: file.name,
          status: 'Pending',
          remarks: '',
          collected: true,
        },
      }));
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  const handleSubmitConsumerCorrection = async (e) => {
    e.preventDefault();
    if (!appData) return;
    setSubmittingCorrection(true);
    setCorrectionError('');
    try {
      const res = await api.updateRegistration(appData._id || appData.registrationId, {
        documents: correctedDocs,
        updatedBy: `Consumer (${currentUser?.fullName || 'Applicant'})`,
      });
      if (res && res.success) {
        setCorrectionSuccessMsg('✅ Your corrected documents have been submitted to the Distributor Desk for re-verification!');
        setTimeout(() => {
          setCorrectionSuccessMsg('');
          fetchMyApplication();
        }, 1500);
      } else {
        setCorrectionError(res?.message || 'Failed to submit documents.');
      }
    } catch (err) {
      setCorrectionError('Server error submitting corrected documents.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  useEffect(() => {
    fetchMyApplication();
  }, [currentUser]);

  const fetchMyApplication = async () => {
    setLoading(true);
    try {
      const query = currentUser?.consumerNo || currentUser?.mobile || currentUser?.registrationId || currentUser?.email;
      if (query) {
        const res = await api.trackApplication(query);
        if (res.success && res.records && res.records.length > 0) {
          setAppData(res.records[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/user/login');
  };

  // Determine multi-tier stage progress
  const getStageStatus = (stageIndex) => {
    if (!appData) return 'pending';
    const overall = appData.overallStatus || (appData.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
    const isRejected = ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(overall) || appData.verification?.status === 'Rejected';
    const partnerStatus = appData.partnerDetails?.status || 'Unassigned';
    const financeStatus = appData.financingDetails?.status || 'Not_Required';
    const installStatus = appData.installerDetails?.status || 'Unassigned';

    if (isRejected) {
      if (stageIndex === 1) return 'completed';
      if (stageIndex === 2 && overall === 'Rejected_By_Distributor') return 'rejected';
      if (stageIndex === 3 && overall === 'Rejected_By_Admin') return 'rejected';
      return 'pending';
    }

    switch (stageIndex) {
      case 1: // Survey Submitted
        return 'completed';
      case 2: // Distributor Verification
        if (['Distributor_Verified', 'Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(overall)) {
          return 'completed';
        }
        if (overall === 'Pending_Distributor') return 'in_progress';
        return 'pending';
      case 3: // Admin Sanction & Partner Assignment
        if (['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(overall)) {
          return 'completed';
        }
        if (overall === 'Distributor_Verified') return 'in_progress';
        return 'pending';
      case 4: // Technical Feasibility (EPC Partner)
        if (partnerStatus === 'Feasibility_Approved') return 'completed';
        if (partnerStatus === 'Assigned') return 'in_progress';
        return 'pending';
      case 5: // Financing
        if (financeStatus === 'Not_Required') return 'skipped';
        if (['Approved', 'Disbursed'].includes(financeStatus)) return 'completed';
        if (financeStatus === 'Pending') return 'in_progress';
        return 'pending';
      case 6: // Rooftop Installation
        if (installStatus === 'Completed') return 'completed';
        if (['Assigned', 'In_Progress'].includes(installStatus)) return 'in_progress';
        return 'pending';
      case 7: // Net Metering & Subsidy
        if (installStatus === 'Completed') return 'completed';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const stages = [
    { title: '1. Field Survey Completed', desc: '10 mandatory documents & rooftop survey logged' },
    { title: '2. Distributor Hub Check', desc: 'Franchise distributor verified all documents' },
    { title: '3. Admin Sanction & Routing', desc: 'Sanction approved & routed to EPC partner' },
    { title: '4. Technical Feasibility', desc: 'EPC partner checked rooftop sizing & load' },
    { title: '5. Green Energy Loan', desc: 'PM Surya Ghar subsidized bank loan' },
    { title: '6. Rooftop Installation', desc: 'Solar panels & inverter installation on-site' },
    { title: '7. DISCOM Net-Meter & Subsidy', desc: 'Bi-directional meter & direct DBT credit' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navbar */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.png" alt="SolarConnect" style={{ height: '32px', objectFit: 'contain' }} />
            </Link>
            <span style={{ fontSize: '12px', background: '#f59e0b20', color: '#f59e0b', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
              Consumer Portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{currentUser?.fullName}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Consumer No: {currentUser?.consumerNo || 'Direct'}</div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading your solar status...</div>
          </div>
        ) : !appData ? (
          <div style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
            <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', margin: '0 0 8px' }}>No Active Application Found</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
              Your account ({currentUser?.email || currentUser?.consumerNo}) is registered, but no field application has been submitted yet by an agent.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                background: '#f59e0b',
                color: '#000',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div>
            {/* Top Overview Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '28px',
                marginBottom: '32px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
                    {appData.fullName}
                  </h1>
                  <span
                    style={{
                      background: '#10b98120',
                      color: '#10b981',
                      border: '1px solid #10b98140',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    Status: {appData.verification?.status || 'Active'}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Application ID: <strong style={{ color: '#f8fafc' }}>{appData.registrationId}</strong> | Consumer No: <strong style={{ color: '#f8fafc' }}>{appData.consumerNo}</strong>
                </div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                  {appData.propertyAddress || appData.address}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowSlipModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f59e0b',
                    color: '#000',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={18} /> View Acknowledgment Slip
                </button>
              </div>
            </div>

            {/* Rejection Alert Banner & Interactive Document Correction Desk */}
            {(() => {
              const overall = appData.overallStatus || (appData.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
              const isRejected = ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(overall) || appData.verification?.status === 'Rejected';
              const docs = appData.documents || {};
              const docLabels = {
                aadhaarCard: '1. Aadhaar Card Scan',
                panCard: '2. PAN Card Official Scan',
                bijliBill: '3. Consumer Electricity Bijli Bill',
                bankPassbook: '4. Bank Passbook / Cheque',
                jaminRasid: '5. Jamin Rasid / Property Deed',
                rooftopGpsPhoto: '6. Rooftop Satellite & Camera Photos',
              };

              const flaggedDocs = Object.keys(docLabels).filter(
                (k) => docs[k]?.status === 'Rejected'
              );
              const hasFlaggedDocs = flaggedDocs.length > 0;
              const showCorrectionDesk = isRejected || hasFlaggedDocs;

              if (!showCorrectionDesk) return null;

              const activeDocKeys = hasFlaggedDocs ? flaggedDocs : Object.keys(docLabels);

              return (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: '1px solid #ef4444',
                    borderRadius: '20px',
                    padding: '24px 28px',
                    marginBottom: '32px',
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
                    <AlertCircle size={32} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                        Action Required: Re-upload Flagged Documents
                      </div>
                      <p style={{ color: '#fca5a5', fontSize: '14px', margin: '0 0 8px', lineHeight: 1.5 }}>
                        <strong>Reviewer Note:</strong> "{appData.distributorVerification?.rejectionReason || appData.adminVerification?.rejectionReason || appData.verification?.remarks || 'Document clarification required'}"
                      </p>
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        You can re-upload your document(s) directly below from your phone or computer. Only the flagged items need to be updated.
                      </div>
                    </div>
                  </div>

                  {correctionSuccessMsg && (
                    <div style={{ background: '#065f4630', border: '1px solid #05966950', color: '#34d399', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', fontWeight: 700, fontSize: '14px' }}>
                      {correctionSuccessMsg}
                    </div>
                  )}

                  {correctionError && (
                    <div style={{ background: '#ef444425', border: '1px solid #ef444450', color: '#f87171', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', fontWeight: 700, fontSize: '14px' }}>
                      {correctionError}
                    </div>
                  )}

                  {/* Interactive Document Re-upload Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    {activeDocKeys.map((docKey) => {
                      const origDoc = docs[docKey] || {};
                      const updatedDoc = correctedDocs[docKey];
                      const isRejectedItem = origDoc.status === 'Rejected' || hasFlaggedDocs;

                      return (
                        <div
                          key={docKey}
                          style={{
                            background: '#090d16',
                            border: updatedDoc ? '1px solid #10b981' : isRejectedItem ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: updatedDoc ? '#34d399' : '#fff' }}>
                                {docLabels[docKey]}
                              </span>
                              {updatedDoc ? (
                                <span style={{ fontSize: '10px', background: '#065f4630', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #05966950' }}>
                                  ✓ New File Attached
                                </span>
                              ) : isRejectedItem ? (
                                <span style={{ fontSize: '10px', background: '#ef444420', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #ef444450' }}>
                                  ✕ Correction Needed
                                </span>
                              ) : null}
                            </div>

                            {origDoc.remarks && (
                              <div style={{ fontSize: '12px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                                Reason: "{origDoc.remarks}"
                              </div>
                            )}

                            {updatedDoc?.fileName ? (
                              <div style={{ fontSize: '12px', color: '#34d399' }}>
                                Selected: <strong>{updatedDoc.fileName}</strong>
                              </div>
                            ) : origDoc.fileName ? (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Previous file: {origDoc.fileName}
                              </div>
                            ) : null}
                          </div>

                          <div>
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: updatedDoc ? '#059669' : isRejectedItem ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : '#334155',
                                color: '#fff',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'center',
                                boxSizing: 'border-box'
                              }}
                            >
                              <Upload size={14} />
                              {updatedDoc ? 'Change Selected File' : 'Upload Replacement File'}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => handleConsumerFileUpload(docKey, e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {Object.keys(correctedDocs).length} new document(s) attached
                    </div>
                    <button
                      type="button"
                      disabled={submittingCorrection || Object.keys(correctedDocs).length === 0}
                      onClick={handleSubmitConsumerCorrection}
                      style={{
                        background: Object.keys(correctedDocs).length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#334155',
                        color: Object.keys(correctedDocs).length > 0 ? '#fff' : '#94a3b8',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: Object.keys(correctedDocs).length > 0 ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: Object.keys(correctedDocs).length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {submittingCorrection ? 'Submitting to Distributor...' : 'Submit Corrected Documents to Distributor'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Live Progress Tracker */}
            <div
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '32px 28px',
                marginBottom: '32px',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#f59e0b" /> Live Installation & Subsidy Milestone Tracker
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                {stages.map((stage, idx) => {
                  const status = getStageStatus(idx + 1);
                  const isDone = status === 'completed';
                  const isCur = status === 'in_progress';
                  const isSkip = status === 'skipped';
                  const isRej = status === 'rejected';

                  return (
                    <div
                      key={idx}
                      style={{
                        background: isRej ? '#7f1d1d35' : isDone ? '#064e3b30' : isCur ? '#1e3a8a30' : '#0f172a',
                        border: `1px solid ${isRej ? '#ef4444' : isDone ? '#10b981' : isCur ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '14px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isRej ? '#ef4444' : isDone ? '#10b981' : isCur ? '#3b82f6' : '#334155',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {isRej ? '✕' : isDone ? <CheckCircle2 size={20} /> : idx + 1}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: isRej ? '#f87171' : isDone ? '#34d399' : isCur ? '#60a5fa' : '#cbd5e1' }}>
                        {stage.title}
                      </div>
                      <div style={{ fontSize: '11px', color: isRej ? '#fca5a5' : '#64748b', lineHeight: 1.3 }}>
                        {isRej ? 'Action Needed / Rejected' : isSkip ? 'Not Needed (Cash)' : stage.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Installer Details Card */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="#a855f7" /> Assigned Installer & EPC Partner
                </h3>
                {appData.installerDetails?.status === 'Assigned' || appData.installerDetails?.status === 'Completed' ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Certified Installer</div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{appData.installerDetails?.installerName}</div>
                      <div style={{ fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Phone size={14} /> {appData.installerDetails?.installerPhone || 'Available upon visit'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>EPC Partner Organization</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{appData.partnerDetails?.partnerName || 'Central EPC Network'}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
                    An installer will be automatically assigned once your EPC partner completes technical feasibility.
                  </div>
                )}
              </div>

              {/* Financing Card */}
              <div
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Banknote size={18} color="#10b981" /> Solar Loan & Subsidy Desk
                </h3>
                <div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Financing Mode</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {appData.financingDetails?.required ? 'PM Surya Ghar Subsidized Loan' : 'Self-Funded / Direct Cash'}
                    </div>
                  </div>
                  {appData.financingDetails?.required && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Loan Status</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: appData.financingDetails?.status === 'Approved' ? '#34d399' : '#f59e0b' }}>
                        {appData.financingDetails?.status} (Sanctioned: ₹{appData.financingDetails?.loanAmount?.toLocaleString('en-IN') || 'Pending'})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slip Modal */}
      {showSlipModal && appData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              color: '#000',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={() => setShowSlipModal(false)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
            <TearOffSlip registrationData={appData} />
          </div>
        </div>
      )}
    </div>
  );
}
