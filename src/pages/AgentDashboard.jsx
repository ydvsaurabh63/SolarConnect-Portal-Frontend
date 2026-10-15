import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  Plus,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  MapPin,
  LayoutDashboard,
  Search,
  LogOut,
  Globe,
  RefreshCw,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Eye,
  FileEdit,
  XCircle,
  X,
  Info,
  Upload,
} from 'lucide-react';
import FieldRegistrationModal from '../components/FieldRegistrationModal';
import VerificationTrackerModal from '../components/VerificationTrackerModal';
import SurveyDetailsModal from '../components/SurveyDetailsModal';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import DashboardMobileNav from '../components/DashboardMobileNav';

export default function AgentDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'surveys' | 'profile'
  const [searchQuery, setSearchQuery] = useState('');
  const [surveyFilter, setSurveyFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Field Registration Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Life-cycle Verification Tracker Modal
  const [viewTrackingApp, setViewTrackingApp] = useState(null);

  // Full Survey Details Modal
  const [viewDetailsApp, setViewDetailsApp] = useState(null);

  // Official Registration Payment Receipt Modal
  const [selectedReceiptApp, setSelectedReceiptApp] = useState(null);

  // Edit & Re-submit Modal for Rejected Surveys
  const [editingApp, setEditingApp] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  useEffect(() => {
    loadMySubmissions();
  }, []);

  const loadMySubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.getSubmissionLog({
        agentId: currentUser?._id || currentUser?.code || currentUser?.executiveId,
      });
      if (res.success) {
        setSubmissions(res.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/agent/login');
  };

  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setEditFormData({
      fullName: app.fullName || '',
      mobile: app.mobile || '',
      alternateNo: app.alternateNo || '',
      consumerNo: app.consumerNo || '',
      avgMonthlyBill: app.avgMonthlyBill || '',
      propertyAddress: app.propertyAddress || app.address || '',
      rooftopArea: app.rooftopArea || '',
      roofType: app.roofType || 'RCC',
      aadhaarNumber: app.aadhaarNumber || '',
      panNumber: app.panNumber || '',
      bankAccountNumber: app.bankDetails?.accountNumber || app.accountNumber || '',
      bankIfsc: app.bankDetails?.ifscCode || app.ifscCode || '',
      bankName: app.bankDetails?.bankName || '',
      documents: app.documents ? JSON.parse(JSON.stringify(app.documents)) : {},
    });
  };

  const handleDocFileUpload = async (docKey, file) => {
    if (!file) return;
    try {
      let finalUrl = '';
      try {
        const res = await api.uploadFile(file, `corrected-${docKey}`);
        if (res && res.success && res.fileUrl) finalUrl = res.fileUrl;
      } catch (e) {}

      if (!finalUrl) {
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      setEditFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: {
            ...(prev.documents?.[docKey] || {}),
            fileUrl: finalUrl,
            fileName: file.name,
            status: 'Pending',
            remarks: '',
            collected: true,
          },
        },
      }));
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingApp) return;
    setEditSubmitting(true);
    try {
      const res = await api.updateRegistration(editingApp._id || editingApp.registrationId, {
        fullName: editFormData.fullName,
        mobile: editFormData.mobile,
        alternateNo: editFormData.alternateNo,
        consumerNo: editFormData.consumerNo,
        avgMonthlyBill: Number(editFormData.avgMonthlyBill) || 0,
        propertyAddress: editFormData.propertyAddress,
        address: editFormData.propertyAddress,
        rooftopArea: Number(editFormData.rooftopArea) || 0,
        roofType: editFormData.roofType,
        aadhaarNumber: editFormData.aadhaarNumber,
        panNumber: editFormData.panNumber,
        bankDetails: {
          accountNumber: editFormData.bankAccountNumber,
          ifscCode: editFormData.bankIfsc,
          bankName: editFormData.bankName,
        },
        documents: editFormData.documents,
        updatedBy: `Agent (${currentUser?.fullName || 'Field Executive'})`,
      });
      if (res && res.success) {
        setEditSuccessMsg('Survey corrected and re-submitted to Distributor Desk!');
        setTimeout(() => {
          setEditSuccessMsg('');
          setEditingApp(null);
          loadMySubmissions();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleFormSubmittedSuccess = (data) => {
    setShowRegModal(false);
    const reg = data?.registration || data;
    const account = data?.consumerAccount || reg?.consumerAccount;
    if (account || reg) {
      const rawFirst = (account?.customerName || reg?.fullName || 'User').trim().split(/\s+/)[0];
      const firstName = rawFirst ? (rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()) : 'User';
      const cleanMob = String(reg?.mobile || '').replace(/\D/g, '');
      const last4Mob = cleanMob.slice(-4) || '1234';
      const computedPass = `${firstName}@${last4Mob}`;

      const finalLoginId = account?.email || reg?.email || account?.loginId || (cleanMob ? `${cleanMob}@solar.com` : reg?.consumerNo);
      const finalPass = (account?.tempPassword && !account.tempPassword.startsWith('Solar@') && !account.tempPassword.startsWith('solar@') && account.tempPassword !== 'user123')
        ? account.tempPassword
        : (reg?.consumerAccount?.tempPassword && !reg.consumerAccount.tempPassword.startsWith('Solar@') && !reg.consumerAccount.tempPassword.startsWith('solar@') && reg.consumerAccount.tempPassword !== 'user123')
          ? reg.consumerAccount.tempPassword
          : computedPass;

      setGeneratedCredentials({
        customerName: account?.customerName || reg?.fullName || 'Customer',
        loginId: finalLoginId,
        email: finalLoginId,
        consumerNo: account?.consumerNo || reg?.consumerNo,
        userCode: account?.userCode || reg?.userCode,
        tempPassword: finalPass,
        registrationId: reg?.registrationId,
      });
    }
    if (reg) {
      setSelectedReceiptApp(reg);
    }
    loadMySubmissions();
  };

  const renderMobileSurveyCard = (sub) => {
    const st = sub.overallStatus || (sub.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
    const isRejected = ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(st);
    const isApproved = ['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(st);

    let badgeColor = '#f59e0b';
    let badgeBg = 'rgba(245, 158, 11, 0.15)';
    let badgeBorder = 'rgba(245, 158, 11, 0.3)';
    let statusLabel = 'Pending Audit';

    if (isRejected) {
      badgeColor = '#f87171';
      badgeBg = 'rgba(239, 68, 68, 0.15)';
      badgeBorder = 'rgba(239, 68, 68, 0.3)';
      statusLabel = st === 'Rejected_By_Distributor' ? 'Rejected (Distributor)' : 'Rejected (Admin)';
    } else if (isApproved) {
      badgeColor = '#34d399';
      badgeBg = 'rgba(16, 185, 129, 0.15)';
      badgeBorder = 'rgba(16, 185, 129, 0.3)';
      statusLabel = 'Sanctioned';
    } else if (st === 'Distributor_Verified') {
      badgeColor = '#38bdf8';
      badgeBg = 'rgba(56, 189, 248, 0.15)';
      badgeBorder = 'rgba(56, 189, 248, 0.3)';
      statusLabel = 'Distributor Verified';
    }

    return (
      <div key={sub._id} className="mobile-app-card">
        <div className="mac-top">
          <div className="mac-name-group">
            <span className="mac-name" onClick={() => setViewDetailsApp(sub)}>{sub.fullName}</span>
            <span className="mac-reg">{sub.registrationId}</span>
          </div>
          <span 
            className="mac-status-badge"
            style={{ color: badgeColor, background: badgeBg, borderColor: badgeBorder }}
            onClick={() => setViewTrackingApp(sub)}
          >
            {isRejected ? <XCircle size={11} /> : isApproved ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {statusLabel}
          </span>
        </div>

        <div className="mac-meta-row">
          <div className="mac-meta-item">
            <span className="mac-meta-label">Mobile</span>
            <span className="mac-meta-val">{sub.mobile}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">CA No.</span>
            <span className="mac-meta-val">{sub.consumerNo}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Bill</span>
            <span className="mac-meta-val">₹{sub.avgMonthlyBill ? sub.avgMonthlyBill.toLocaleString('en-IN') : '0'}</span>
          </div>
        </div>

        {isRejected && (
          <div style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '6px 10px', margin: '8px 0', lineHeight: 1.3 }}>
            <strong>Reviewer Note:</strong> "{sub.distributorVerification?.rejectionReason || sub.adminVerification?.rejectionReason || sub.verification?.remarks || 'Documents or survey data need correction.'}"
          </div>
        )}

        <div className="mac-actions">
          {isRejected && (
            <button 
              type="button" 
              className="mac-action-btn fix"
              onClick={() => handleOpenEdit(sub)}
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
            >
              <FileEdit size={12} /> Fix Details
            </button>
          )}
          <button 
            type="button" 
            className="mac-action-btn receipt"
            onClick={() => setSelectedReceiptApp(sub)}
          >
            <FileText size={13} /> Receipt
          </button>
          <button 
            type="button" 
            className="mac-action-btn view"
            onClick={() => setViewDetailsApp(sub)}
          >
            <Eye size={13} /> View
          </button>
        </div>
      </div>
    );
  };

  const copyCreds = () => {
    if (!generatedCredentials) return;
    const loginId = generatedCredentials.email || generatedCredentials.loginId;
    const text = `SolarConnect Portal Login Credentials:\nCustomer Name: ${generatedCredentials.customerName || 'Customer'}\nPortal URL: ${window.location.origin}/user/login\nLogin ID (Email): ${loginId}\nPassword: ${generatedCredentials.tempPassword}\nConsumer CA No: ${generatedCredentials.consumerNo || '—'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Search filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        const st = sub.overallStatus || (sub.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
        if (surveyFilter === 'PENDING') return st === 'Pending_Distributor';
        if (surveyFilter === 'VERIFIED') return ['Distributor_Verified', 'Assigned_To_Partner', 'Feasibility_Approved'].includes(st);
        if (surveyFilter === 'REJECTED') return ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(st) || sub.verification?.status === 'Rejected';
        return true;
      })
      .filter((sub) =>
        sub.registrationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.consumerNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.districtCity?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [submissions, surveyFilter, searchQuery]);

  const pendingCount = submissions.filter((s) => (s.overallStatus || 'Pending_Distributor') === 'Pending_Distributor').length;
  const verifiedCount = submissions.filter((s) => ['Distributor_Verified', 'Assigned_To_Partner', 'Feasibility_Approved'].includes(s.overallStatus)).length;
  const rejectedCount = submissions.filter((s) => ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(s.overallStatus) || s.verification?.status === 'Rejected').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090d16', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      {/* -------------------- LEFT ENTERPRISE SIDEBAR -------------------- */}
      <aside
        style={{
          width: '270px',
          background: '#0d1527',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              }}
            >
              <UserCheck size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                SolarConnect
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                {currentUser?.fullName || 'Agent'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'overview' ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: activeTab === 'overview' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={17} color={activeTab === 'overview' ? '#fff' : '#10b981'} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('surveys')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'surveys' ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: activeTab === 'surveys' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={17} color={activeTab === 'surveys' ? '#fff' : '#38bdf8'} />
                <span>Surveys</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {submissions.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Profile & Sign Out */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: activeTab === 'profile' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid ' + (activeTab === 'profile' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
              color: activeTab === 'profile' ? '#c084fc' : '#e2e8f0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <UserCheck size={16} color="#c084fc" />
            <span>Profile ({currentUser?.fullName?.split(' ')[0] || 'My Account'})</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* -------------------- MAIN CONTENT AREA -------------------- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Mobile App Navigation (Top App Bar & Bottom Dock) */}
        <DashboardMobileNav
          role="Agent"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          tabs={[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'surveys', label: 'Surveys', icon: FileText, badge: submissions.length },
            { id: 'profile', label: 'Profile', icon: UserCheck },
          ]}
        />
        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <div
            className="impersonation-mobile-banner"
            style={{
              background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
              color: '#fff',
              padding: '9px 28px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>👁️ <strong>IMPERSONATION SESSION:</strong> Operating as Agent <strong>{currentUser.fullName}</strong>.</span>
            <button
              onClick={() => window.close()}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Close Tab
            </button>
          </div>
        )}

        {/* Top Header Command Bar */}
        <header
          style={{
            height: '70px',
            background: '#0d1527',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
            <span style={{ color: '#cbd5e1' }}>Agent</span>
            <span>/</span>
            <span style={{ color: '#10b981', fontWeight: 600, textTransform: 'capitalize' }}>{activeTab}</span>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by name, CA, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={loadMySubmissions}
              title="Refresh Data"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="dashboard-main-content" style={{ padding: '28px', maxWidth: '1400px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          {/* 4 Rich KPI Metric Cards */}
          <div className="dashboard-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('surveys'); setSurveyFilter('ALL'); }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Total Surveys Completed</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '12px' }}>{submissions.length}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Digital booklets registered</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('surveys'); setSurveyFilter('PENDING'); }}
              style={{
                background: pendingCount > 0 ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid ' + (pendingCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>Pending Distributor Audit</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '12px' }}>{pendingCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px' }}>Awaiting franchise review</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('surveys'); setSurveyFilter('VERIFIED'); }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Verified ➔ Admin Sanction</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '12px' }}>{verifiedCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Passed distributor audit</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('surveys'); setSurveyFilter('REJECTED'); }}
              style={{
                background: rejectedCount > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid ' + (rejectedCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: rejectedCount > 0 ? '#f87171' : '#94a3b8', fontWeight: 600 }}>Action Required / Rejected</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: rejectedCount > 0 ? '#f87171' : '#f8fafc', marginTop: '12px' }}>{rejectedCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Requires booklet document re-upload</div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Actions Bar inside Overview */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>Quick Actions</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>Initiate PM Surya Ghar 10-document solar survey or review submitted booklet audits.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowRegModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <Plus size={16} /> + New 10-Doc Survey
                  </button>
                  <button
                    onClick={() => { setActiveTab('surveys'); setSurveyFilter('PENDING'); }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Clock size={15} /> Awaiting Franchise Audit ({pendingCount})
                  </button>
                </div>
              </div>

              {/* Recent Applications Quick Table */}
              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={19} color="#34d399" /> Recent Customer Applications ({submissions.length})
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Latest solar survey entries registered under your agent credentials.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('surveys')}
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All Surveys
                  </button>
                </div>

                <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>Reg ID</th>
                        <th style={{ padding: '12px 16px' }}>Customer Name (Tap to View)</th>
                        <th style={{ padding: '12px 16px' }}>CA / Mobile</th>
                        <th style={{ padding: '12px 16px' }}>Monthly Bill</th>
                        <th style={{ padding: '12px 16px' }}>Status (Tap to Track)</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.slice(0, 5).map((sub) => (
                        <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f59e0b' }}>{sub.registrationId}</td>
                          <td 
                            style={{ padding: '14px 16px', fontWeight: 600, color: '#38bdf8', cursor: 'pointer' }}
                            onClick={() => setViewDetailsApp(sub)}
                            title="Click to view full customer survey & documents"
                          >
                            <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{sub.fullName}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div>{sub.mobile}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>CA: {sub.consumerNo}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>₹{sub.avgMonthlyBill?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span 
                              onClick={() => setViewTrackingApp(sub)}
                              title="Click to track complete verification lifecycle"
                              style={{ 
                                fontSize: '11px', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                background: 'rgba(245, 158, 11, 0.15)', 
                                color: '#f59e0b', 
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <Clock size={11} /> {sub.overallStatus ? sub.overallStatus.replace(/_/g, ' ') : 'Pending Distributor'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => setSelectedReceiptApp(sub)}
                                style={{ 
                                  background: 'rgba(16, 185, 129, 0.1)', 
                                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                                  color: '#34d399', 
                                  padding: '6px 12px', 
                                  borderRadius: '6px', 
                                  fontSize: '12px', 
                                  fontWeight: 600, 
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                                title="View official PM Surya Ghar registration payment receiving"
                              >
                                <FileText size={12} /> Receipt
                              </button>
                              <button
                                onClick={() => setViewDetailsApp(sub)}
                                style={{ 
                                  background: 'rgba(56, 189, 248, 0.1)', 
                                  border: '1px solid rgba(56, 189, 248, 0.3)', 
                                  color: '#38bdf8', 
                                  padding: '6px 12px', 
                                  borderRadius: '6px', 
                                  fontSize: '12px', 
                                  fontWeight: 600, 
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <Eye size={12} /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {submissions.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
                            No consumer applications logged yet. Click "+ Start New Customer Survey" to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards for Overview */}
                <div className="mobile-only-card-list">
                  {submissions.slice(0, 5).map((sub) => renderMobileSurveyCard(sub))}
                  {submissions.length === 0 && (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No consumer applications logged yet. Click "+ New 10-Doc Survey" above to begin.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FULL SURVEYS TABLE */}
          {activeTab === 'surveys' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>My Registered Customer Applications ({filteredSubmissions.length})</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Monitor real-time status of your submitted rooftop surveys through distributor and admin checks.</p>
                </div>
                <button
                  onClick={() => setShowRegModal(true)}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Plus size={18} /> + New Field Survey
                </button>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {[
                  { key: 'ALL', label: `All Surveys (${submissions.length})` },
                  { key: 'PENDING', label: `Pending Distributor (${pendingCount})`, color: '#f59e0b' },
                  { key: 'VERIFIED', label: `Verified & Forwarded (${verifiedCount})`, color: '#38bdf8' },
                  { key: 'REJECTED', label: `Action Needed (${rejectedCount})`, color: '#ef4444' },
                ].map((f) => {
                  const isActive = surveyFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setSurveyFilter(f.key)}
                      style={{
                        background: isActive ? (f.color || '#10b981') : '#1e293b',
                        color: isActive ? '#fff' : '#94a3b8',
                        border: '1px solid ' + (isActive ? 'transparent' : 'rgba(255,255,255,0.08)'),
                        padding: '7px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="desktop-only-table" style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '16px 20px' }}>Reg ID</th>
                      <th style={{ padding: '16px 20px' }}>Customer Name (Tap to View)</th>
                      <th style={{ padding: '16px 20px' }}>Mobile / Consumer No</th>
                      <th style={{ padding: '16px 20px' }}>Monthly Bill</th>
                      <th style={{ padding: '16px 20px' }}>Verification Status (Tap to Track)</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((sub) => {
                      const st = sub.overallStatus || (sub.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
                      const isRejected = ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(st);
                      return (
                        <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 700, color: '#f59e0b' }}>{sub.registrationId}</td>
                          <td 
                            style={{ padding: '16px 20px', fontWeight: 600, color: '#38bdf8', cursor: 'pointer' }}
                            onClick={() => setViewDetailsApp(sub)}
                            title="Click to view full 10-point customer survey & documents"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{sub.fullName}</span>
                              <Eye size={13} color="#38bdf8" />
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div>{sub.mobile}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>CA: {sub.consumerNo}</div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>₹{sub.avgMonthlyBill?.toLocaleString('en-IN')}</td>
                          <td 
                            style={{ padding: '16px 20px', cursor: 'pointer' }}
                            onClick={() => setViewTrackingApp(sub)}
                            title="Click to track complete verification lifecycle"
                          >
                            {(() => {
                              if (st === 'Rejected_By_Distributor') {
                                return (
                                  <div>
                                    <span style={{ background: '#ef444420', color: '#f87171', border: '1px solid #ef444440', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                      <XCircle size={12} /> Rejected by Distributor
                                    </span>
                                    {sub.distributorVerification?.rejectionReason && (
                                      <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', maxWidth: '240px', lineHeight: 1.3 }}>
                                        ⚠️ "{sub.distributorVerification.rejectionReason}"
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              if (st === 'Rejected_By_Admin') {
                                return (
                                  <div>
                                    <span style={{ background: '#ea580c20', color: '#fb923c', border: '1px solid #ea580c40', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                      <XCircle size={12} /> Rejected by Admin
                                    </span>
                                    {sub.adminVerification?.rejectionReason && (
                                      <div style={{ fontSize: '11px', color: '#fb923c', marginTop: '4px', maxWidth: '240px', lineHeight: 1.3 }}>
                                        ⚠️ "{sub.adminVerification.rejectionReason}"
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              if (st === 'Distributor_Verified') {
                                return (
                                  <span style={{ background: '#0284c720', color: '#38bdf8', border: '1px solid #0284c740', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                    <CheckCircle2 size={12} /> Distributor Verified (Pending Admin)
                                  </span>
                                );
                              }
                              if (['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(st)) {
                                return (
                                  <span style={{ background: '#10b98120', color: '#34d399', border: '1px solid #10b98140', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                    <CheckCircle2 size={12} /> Sanctioned & Assigned to Partner
                                  </span>
                                );
                              }
                              return (
                                <span style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                  <Clock size={12} /> Pending Distributor Audit
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              {isRejected && (
                                <button
                                  onClick={() => handleOpenEdit(sub)}
                                  style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Edit survey data and re-submit for distributor verification"
                                >
                                  <FileEdit size={12} /> Fix & Re-submit
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedReceiptApp(sub)}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#34d399',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                title="View official PM Surya Ghar registration payment receipt"
                              >
                                <FileText size={13} /> Receipt
                              </button>
                              <button
                                onClick={() => setViewDetailsApp(sub)}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  color: '#38bdf8',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Eye size={13} /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No customer surveys found matching your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Tab 2 */}
              <div className="mobile-only-card-list">
                {filteredSubmissions.map((sub) => renderMobileSurveyCard(sub))}
                {filteredSubmissions.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    No customer surveys found matching your query.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AGENT PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#fff' }}>Ground Agent Terminal Profile</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Field Representative Name</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{currentUser?.fullName}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Agent Unique Code</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{currentUser?.code || currentUser?.executiveId || 'AGT-101-01-01'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Assigned Ward / Sector</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{currentUser?.territory || 'Active Sector'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Parent Solar Distributor</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>{currentUser?.distributorName || 'Rohini Franchise'} ({currentUser?.distributorCode || 'DST-101-01'})</div>
                </div>
              </div>

              {/* Profile Bottom Sign Out / Logout Action */}
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <LogOut size={16} /> Sign Out / Logout
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Field Registration Modal */}
      {showRegModal && (
        <FieldRegistrationModal
          isOpen={showRegModal}
          onClose={() => setShowRegModal(false)}
          onSuccess={handleFormSubmittedSuccess}
          executiveData={{
            name: currentUser?.fullName || 'Field Executive',
            id: currentUser?.code || currentUser?.executiveId || 'AGT-101-01-01',
            agentId: currentUser?._id,
            agentCode: currentUser?.code || currentUser?.executiveId,
            distributorId: currentUser?.distributorId || currentUser?.createdById,
            distributorName: currentUser?.distributorName || currentUser?.createdByName,
            distributorCode: currentUser?.distributorCode,
            adminId: currentUser?.adminId,
            adminName: currentUser?.adminName,
            adminCode: currentUser?.adminCode,
          }}
        />
      )}

      {/* Instant Consumer Credentials Generated Modal */}
      {generatedCredentials && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #10b98150', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>Registration Successful!</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px' }}>
              Customer account created for <strong>{generatedCredentials.customerName}</strong>. Hand over these login credentials so they can track their live status.
            </p>

            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
              {generatedCredentials.userCode && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unique User ID</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{generatedCredentials.userCode}</div>
                </div>
              )}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Login ID (Email Address)</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', wordBreak: 'break-all' }}>{generatedCredentials.email || generatedCredentials.loginId}</div>
              </div>
              {generatedCredentials.consumerNo && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Consumer CA Number</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#cbd5e1', fontFamily: 'monospace' }}>{generatedCredentials.consumerNo}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Generated Password</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>{generatedCredentials.tempPassword}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={copyCreds}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: copied ? '#059669' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied Details!' : 'Copy to Share'}
              </button>
              <button
                onClick={() => setGeneratedCredentials(null)}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Verification Lifecycle Tracker Modal */}
      {viewTrackingApp && (
        <VerificationTrackerModal
          application={viewTrackingApp}
          onClose={() => setViewTrackingApp(null)}
        />
      )}

      {/* Complete Customer Survey Details Modal */}
      {viewDetailsApp && (
        <SurveyDetailsModal
          application={viewDetailsApp}
          onClose={() => setViewDetailsApp(null)}
          isAgent={true}
          onEdit={handleOpenEdit}
        />
      )}

      {/* Edit & Re-submit Modal for Rejected Surveys */}
      {editingApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 160, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #f59e0b50', borderRadius: '20px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                  <FileEdit size={16} /> Edit & Re-submit Rejected Survey
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px', color: '#fff' }}>
                  {editingApp.fullName} — {editingApp.registrationId}
                </h3>
                <div style={{ fontSize: '12px', color: '#f87171' }}>
                  Rejection Reason: "{editingApp.distributorVerification?.rejectionReason || editingApp.adminVerification?.rejectionReason || 'Please verify document data and re-submit.'}"
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {editSuccessMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', background: '#065f4630', border: '1px solid #05966950', color: '#34d399', fontSize: '14px', fontWeight: 700 }}>
                ✅ {editSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Consumer CA Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.consumerNo}
                    onChange={(e) => setEditFormData({ ...editFormData, consumerNo: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Average Monthly Bill (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.avgMonthlyBill}
                    onChange={(e) => setEditFormData({ ...editFormData, avgMonthlyBill: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Aadhaar Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.aadhaarNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>PAN Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.panNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Site Address</label>
                  <input
                    type="text"
                    required
                    value={editFormData.propertyAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, propertyAddress: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Document Re-upload Section for Rejected Items */}
              {(() => {
                const docLabels = {
                  aadhaarCard: '1. Aadhaar Card Scan',
                  panCard: '2. PAN Card Official Scan',
                  bijliBill: '3. Consumer Electricity Bijli Bill',
                  bankPassbook: '4. Bank Passbook / Cheque',
                  jaminRasid: '5. Jamin Rasid / Property Deed',
                  rooftopGpsPhoto: '6. Rooftop Satellite & Camera Photos',
                };
                const rejectedList = Object.entries(editFormData.documents || {}).filter(
                  ([k, d]) => d?.status === 'Rejected' || editingApp.documents?.[k]?.status === 'Rejected'
                );

                return (
                  <div style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 800, letterSpacing: '0.4px' }}>
                        Document Upload Desk {rejectedList.length > 0 ? `(${rejectedList.length} Flagged for Correction)` : '(Optional Document Updates)'}
                      </span>
                    </div>

                    {rejectedList.length > 0 && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#fca5a5' }}>
                        ⚠️ Reviewer flagged specific document(s). Upload replacement files below to resolve rejection:
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      {Object.keys(docLabels).map((docKey) => {
                        const docObj = editFormData.documents?.[docKey] || editingApp.documents?.[docKey] || {};
                        const isRejectedDoc = docObj.status === 'Rejected';

                        return (
                          <div 
                            key={docKey}
                            style={{
                              background: isRejectedDoc ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              border: isRejectedDoc ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: isRejectedDoc ? '#f87171' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isRejectedDoc && <XCircle size={14} color="#f87171" />}
                                {docLabels[docKey]}
                              </div>
                              {isRejectedDoc && docObj.remarks && (
                                <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
                                  Reason: "{docObj.remarks}"
                                </div>
                              )}
                              {docObj.fileName && (
                                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                                  ✓ Attached: {docObj.fileName}
                                </div>
                              )}
                            </div>

                            <div>
                              <label style={{ background: isRejectedDoc ? '#ef4444' : '#334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Upload size={12} /> {docObj.fileUrl ? 'Replace File' : 'Upload File'}
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleDocFileUpload(docKey, e.target.files?.[0])}
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                >
                  {editSubmitting ? 'Saving...' : 'Re-submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Registration Payment Receipt Modal */}
      {selectedReceiptApp && (
        <PaymentReceiptModal
          application={selectedReceiptApp}
          onClose={() => setSelectedReceiptApp(null)}
        />
      )}
    </div>
  );
}
