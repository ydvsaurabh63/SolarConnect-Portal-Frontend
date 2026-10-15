import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sun,
  CheckCircle2,
  Wrench,
  Banknote,
  User,
  Phone,
  MapPin,
  Send,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  LayoutDashboard,
  Search,
  LogOut,
  Globe,
  RefreshCw,
  Building2,
  Clock,
  ShieldCheck,
  Zap,
  Eye,
  AlertTriangle,
  XCircle,
  FileText,
  Camera,
  Maximize2,
  Navigation,
  Check,
  X,
  FileCheck,
  Layers,
  Home,
  CheckSquare,
} from 'lucide-react';
import DashboardMobileNav from '../components/DashboardMobileNav';
import DocumentComparisonCards from '../components/DocumentComparisonCards';

export default function PartnerDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'applications' | 'installers' | 'profile'
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add Installer modal
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [instForm, setInstForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: 'install123',
    companyName: 'Neha Solar',
    territory: 'Delhi NCR',
  });
  const [instMsg, setInstMsg] = useState('');

  // Edit Installer modal
  const [editInst, setEditInst] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    companyName: '',
    territory: '',
  });
  const [editMsg, setEditMsg] = useState('');

  // Assign Installer Modal
  const [assignApp, setAssignApp] = useState(null);
  const [selectedInstallerId, setSelectedInstallerId] = useState('');

  // Feasibility modal & 10-Point Document Audit
  const [feasibilityApp, setFeasibilityApp] = useState(null);
  const [feasibilityTab, setFeasibilityTab] = useState('documents'); // 'documents' | 'site' | 'customer'
  const [feasibilityNotes, setFeasibilityNotes] = useState('Site inspection verified. RCC shadow-free roof suitable for proposed solar capacity.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [docAudits, setDocAudits] = useState({});
  const [submittingFeasibility, setSubmittingFeasibility] = useState(false);
  const [feasibilityMsg, setFeasibilityMsg] = useState('');
  const [activePhotoPreview, setActivePhotoPreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, instRes] = await Promise.all([
        api.getSubmissionLog(),
        api.getUsers({ role: 'installer' }),
      ]);
      if (appsRes.success) setApplications(appsRes.records || []);
      if (instRes.success) setInstallers(instRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/partner/login');
  };

  const handleCreateInstaller = async (e) => {
    e.preventDefault();
    setInstMsg('');
    try {
      const res = await api.createUser({
        ...instForm,
        role: 'installer',
        createdById: currentUser?._id,
        createdByName: currentUser?.fullName,
      });

      if (res.success) {
        setShowAddInstModal(false);
        setInstForm({ fullName: '', email: '', mobile: '', password: 'install123', companyName: '', territory: '' });
        loadData();
      } else {
        setInstMsg('❌ ' + (res.message || 'Error creating installer'));
      }
    } catch (err) {
      setInstMsg('❌ Error creating installer');
    }
  };

  const handleOpenEdit = (inst) => {
    setEditInst(inst);
    setEditForm({
      fullName: inst.fullName || '',
      email: inst.email || '',
      mobile: inst.mobile || '',
      password: inst.password || '',
      companyName: inst.companyName || '',
      territory: inst.territory || '',
    });
    setEditMsg('');
  };

  const handleUpdateInstaller = async (e) => {
    e.preventDefault();
    if (!editInst) return;
    setEditMsg('');
    try {
      const res = await api.updateUser(editInst._id, editForm);
      if (res.success) {
        setEditInst(null);
        loadData();
      } else {
        setEditMsg('❌ ' + (res.message || 'Failed to update installer'));
      }
    } catch (err) {
      setEditMsg('❌ Error updating installer');
    }
  };

  const handleDeleteInstaller = async (id) => {
    if (window.confirm('Are you sure you want to delete this installer?')) {
      await api.deleteUser(id);
      loadData();
    }
  };

  const handleLoginAsInstaller = (inst) => {
    const url = `${window.location.origin}/installer/dashboard?impersonate=${inst._id}&by=partner`;
    window.open(url, '_blank');
  };

  const handleOpenFeasibilityModal = (app) => {
    setFeasibilityApp(app);
    setFeasibilityTab('documents');
    setFeasibilityNotes(
      app.technicalFeasibility?.notes || 
      app.partnerDetails?.feasibilityNotes || 
      'Site engineering inspection verified. Shadow-free rooftop structure is stable and feasible for proposed solar system capacity.'
    );
    setRejectionReason('');
    setFeasibilityMsg('');
    
    // Seed initial document audit status
    const initialAudits = {};
    if (app.documents) {
      Object.entries(app.documents).forEach(([key, val]) => {
        if (val && typeof val === 'object') {
          initialAudits[key] = {
            status: val.status || 'Verified',
            remarks: val.remarks || '',
          };
        }
      });
    }
    setDocAudits(initialAudits);
  };

  const handleDocAuditChange = (docKey, auditData, fullAudits) => {
    setDocAudits(fullAudits || { ...docAudits, [docKey]: auditData });
  };

  const handleFeasibilitySubmit = async (status) => {
    if (!feasibilityApp) return;
    setSubmittingFeasibility(true);
    setFeasibilityMsg('');
    try {
      const isReject = status === 'Feasibility_Rejected' || status === 'Rejected';
      const notes = isReject ? (rejectionReason || 'Feasibility rejected by EPC Partner.') : feasibilityNotes;
      const res = await api.partnerVerify(
        feasibilityApp._id,
        isReject ? 'Feasibility_Rejected' : 'Feasibility_Approved',
        notes,
        docAudits,
        isReject ? rejectionReason : '',
        currentUser?.companyName || currentUser?.fullName || 'Solarize EPC Desk'
      );
      if (res.success) {
        setFeasibilityMsg(`✅ Feasibility updated successfully: ${isReject ? 'Rejected' : 'Approved'}`);
        setTimeout(() => {
          setFeasibilityApp(null);
          loadData();
        }, 800);
      } else {
        setFeasibilityMsg(`❌ ${res.message || 'Error updating feasibility'}`);
      }
    } catch (err) {
      setFeasibilityMsg('❌ Failed to update feasibility assessment');
    } finally {
      setSubmittingFeasibility(false);
    }
  };

  const handleAssignInstallerSubmit = async () => {
    if (!assignApp || !selectedInstallerId) return;
    const inst = installers.find((i) => i._id === selectedInstallerId);
    if (!inst) return;
    await api.assignInstaller(assignApp._id, inst._id, inst.fullName, inst.mobile);
    setAssignApp(null);
    setSelectedInstallerId('');
    loadData();
  };

  const handleRequestFinancing = async (appId) => {
    await api.financeVerify(appId, 'Pending', 110000, 'Requested PM Surya Ghar loan sanction', 'seed_financer_01', 'SBI');
    alert('Application forwarded to Financer for loan approval!');
    loadData();
  };

  // Search filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) =>
      app.registrationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.consumerNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.districtCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [applications, searchQuery]);

  // Search filtered installers
  const filteredInstallers = useMemo(() => {
    return installers.filter((i) =>
      i.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [installers, searchQuery]);

  const feasibilityPendingCount = applications.filter((a) => !a.technicalFeasibility?.status || a.technicalFeasibility?.status === 'Pending').length;
  const feasibilityApprovedCount = applications.filter((a) => a.technicalFeasibility?.status === 'Feasibility_Approved').length;

  const renderMobileProjectCard = (app) => {
    const isApproved = app.technicalFeasibility?.status === 'Feasibility_Approved';
    return (
      <div key={app._id} className="mobile-app-card">
        <div className="mac-top">
          <div className="mac-name-group">
            <span className="mac-name" onClick={() => handleOpenFeasibilityModal(app)}>{app.fullName}</span>
            <span className="mac-reg">{app.registrationId}</span>
          </div>
          <span 
            className="mac-status-badge"
            style={{
              color: isApproved ? '#34d399' : '#f59e0b',
              background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              borderColor: isApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            }}
          >
            {isApproved ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {app.technicalFeasibility?.status || 'Pending Review'}
          </span>
        </div>

        <div className="mac-meta-row">
          <div className="mac-meta-item">
            <span className="mac-meta-label">Location</span>
            <span className="mac-meta-val">{app.districtCity || 'Delhi'}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">CA No.</span>
            <span className="mac-meta-val">{app.consumerNo}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Installer</span>
            <span className="mac-meta-val">{app.installationDetails?.installerName || 'Unassigned'}</span>
          </div>
        </div>

        <div className="mac-actions">
          <button 
            type="button" 
            className="mac-action-btn view"
            onClick={() => handleOpenFeasibilityModal(app)}
          >
            <Eye size={13} /> Inspect & Verify Dossier
          </button>
        </div>
      </div>
    );
  };

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
                background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(8, 145, 178, 0.3)',
              }}
            >
              <Sun size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                SolarConnect
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Partner
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(30, 41, 59, 0.6) 100%)',
              border: '1px solid rgba(34, 211, 238, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {currentUser?.fullName?.[0] || 'P'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.companyName || currentUser?.fullName || 'Partner'}
              </div>
              <div style={{ fontSize: '11px', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                Online
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
                background: activeTab === 'overview' ? 'linear-gradient(90deg, #0891b2 0%, #0e7490 100%)' : 'transparent',
                color: activeTab === 'overview' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={17} color={activeTab === 'overview' ? '#fff' : '#0891b2'} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'applications' ? 'linear-gradient(90deg, #0891b2 0%, #0e7490 100%)' : 'transparent',
                color: activeTab === 'applications' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sun size={17} color={activeTab === 'applications' ? '#fff' : '#22d3ee'} />
                <span>Applications</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('installers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'installers' ? 'linear-gradient(90deg, #0891b2 0%, #0e7490 100%)' : 'transparent',
                color: activeTab === 'installers' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wrench size={17} color={activeTab === 'installers' ? '#fff' : '#a855f7'} />
                <span>Installer</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {installers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'profile' ? 'linear-gradient(90deg, #0891b2 0%, #0e7490 100%)' : 'transparent',
                color: activeTab === 'profile' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={17} color={activeTab === 'profile' ? '#fff' : '#38bdf8'} />
                <span>Profile</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Globe size={14} /> Main Portal Website
          </Link>

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
          role="Partner"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          tabs={[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'applications', label: 'Projects', icon: FileText, badge: applications.length },
            { id: 'installers', label: 'Installers', icon: Wrench, badge: installers.length },
            { id: 'profile', label: 'Profile', icon: Building2 },
          ]}
        />
        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <div
            style={{
              background: 'linear-gradient(90deg, #0891b2 0%, #0e7490 100%)',
              color: '#fff',
              padding: '9px 28px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>👁️ <strong>IMPERSONATION SESSION:</strong> Operating as EPC Partner <strong>{currentUser.fullName}</strong>.</span>
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
            <span style={{ color: '#cbd5e1' }}>Partner</span>
            <span>/</span>
            <span style={{ color: '#22d3ee', fontWeight: 600, textTransform: 'capitalize' }}>{activeTab}</span>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search projects, CA, city..."
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
              onClick={loadData}
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

            {activeTab === 'installers' && (
              <button
                onClick={() => setShowAddInstModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(8, 145, 178, 0.3)',
                }}
              >
                <Plus size={16} /> + Add Installer
              </button>
            )}
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="dashboard-main-content" style={{ padding: '28px', maxWidth: '1400px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          {/* 4 Rich KPI Metric Cards */}
          <div className="dashboard-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div
              className="kpi-metric-card"
              onClick={() => setActiveTab('applications')}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Total Allotted Projects</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(34, 211, 238, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                  <Sun size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#22d3ee', marginTop: '12px' }}>{applications.length}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Assigned by Central Admin</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => setActiveTab('applications')}
              style={{
                background: feasibilityPendingCount > 0 ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid ' + (feasibilityPendingCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>Feasibility Review Pending</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '12px' }}>{feasibilityPendingCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px' }}>Requires rooftop site assessment</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => setActiveTab('installers')}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Certified Installers</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                  <Wrench size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#a855f7', marginTop: '12px' }}>{installers.length}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Commissioning technical workforce</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => setActiveTab('applications')}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Feasibility Approved</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '12px' }}>{feasibilityApprovedCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Ready for installer work order</div>
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
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>Onboard certified solar installers or evaluate rooftop structural feasibility.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowAddInstModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
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
                      boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
                    }}
                  >
                    <Plus size={16} /> + Add Certified Installer
                  </button>
                  <button
                    onClick={() => { setActiveTab('applications'); setFeasibilityFilter('PENDING'); }}
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
                    <Clock size={15} /> Review Feasibility ({feasibilityPendingCount})
                  </button>
                </div>
              </div>

              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sun size={19} color="#22d3ee" /> Active Solar Projects Desk
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Verify rooftop structural feasibility, assign certified field installers, and request green loan sanctions.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('applications')}
                    style={{ background: 'rgba(8, 145, 178, 0.15)', border: '1px solid rgba(8, 145, 178, 0.3)', color: '#22d3ee', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All Projects ({applications.length})
                  </button>
                </div>

                <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>Project ID</th>
                        <th style={{ padding: '12px 16px' }}>Applicant</th>
                        <th style={{ padding: '12px 16px' }}>Location</th>
                        <th style={{ padding: '12px 16px' }}>Feasibility Status</th>
                        <th style={{ padding: '12px 16px' }}>Assigned Installer</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 5).map((app) => (
                        <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f59e0b' }}>{app.registrationId}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                            <div>{app.fullName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>CA: {app.consumerNo}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{app.districtCity || 'Delhi'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: app.technicalFeasibility?.status === 'Feasibility_Approved' ? '#065f4625' : '#f59e0b20', color: app.technicalFeasibility?.status === 'Feasibility_Approved' ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                              {app.technicalFeasibility?.status || 'Pending Review'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                            {app.installationDetails?.installerName ? (
                              <span style={{ color: '#a855f7', fontWeight: 600 }}>{app.installationDetails.installerName}</span>
                            ) : (
                              <span style={{ color: '#64748b' }}>Not Assigned</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenFeasibilityModal(app)}
                              style={{ background: 'rgba(8, 145, 178, 0.18)', border: '1px solid rgba(8, 145, 178, 0.4)', color: '#22d3ee', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Eye size={13} /> Inspect & Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                      {applications.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
                            No solar applications assigned to this EPC partner yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards for Projects */}
                <div className="mobile-only-card-list">
                  {applications.slice(0, 5).map((app) => renderMobileProjectCard(app))}
                  {applications.length === 0 && (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No solar applications assigned to this EPC partner yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>Allocated Solar Applications ({filteredApps.length})</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Perform site engineering audits, allot work orders to field technicians, and track loan disbursement.</p>
                </div>
              </div>

              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '16px 20px' }}>Reg ID</th>
                      <th style={{ padding: '16px 20px' }}>Customer & CA</th>
                      <th style={{ padding: '16px 20px' }}>Rooftop Feasibility</th>
                      <th style={{ padding: '16px 20px' }}>Assigned Installer</th>
                      <th style={{ padding: '16px 20px' }}>Financing Status</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 700, color: '#f59e0b', cursor: 'pointer' }} onClick={() => handleOpenFeasibilityModal(app)} title="Click to inspect dossier">{app.registrationId}</td>
                        <td style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => handleOpenFeasibilityModal(app)} title="Click to inspect dossier">
                          <div style={{ fontWeight: 600, color: '#fff' }}>{app.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>CA: {app.consumerNo} | 📞 {app.mobile}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{app.propertyAddress || app.districtCity}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div>
                            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: app.technicalFeasibility?.status === 'Feasibility_Approved' ? '#065f4625' : '#f59e0b20', color: app.technicalFeasibility?.status === 'Feasibility_Approved' ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                              {app.technicalFeasibility?.status || 'Pending Check'}
                            </span>
                            {app.technicalFeasibility?.notes && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', maxWidth: '200px' }}>
                                {app.technicalFeasibility.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {app.installationDetails?.installerName ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#a855f7' }}>{app.installationDetails.installerName}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {app.installationDetails.installerMobile}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssignApp(app)}
                              style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Assign Installer
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {app.financingDetails?.status ? (
                            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: app.financingDetails.status === 'Approved' ? '#065f4625' : '#f59e0b20', color: app.financingDetails.status === 'Approved' ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                              Loan: {app.financingDetails.status}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestFinancing(app._id)}
                              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Request Loan Sanction
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenFeasibilityModal(app)}
                            style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)', border: '1px solid #0891b2', color: '#22d3ee', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(8, 145, 178, 0.25)' }}
                          >
                            <Eye size={14} /> Inspect & Verify Dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredApps.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No solar projects found matching your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INSTALLERS */}
          {activeTab === 'installers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>Certified Installers Workforce ({filteredInstallers.length})</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Manage certified technical contractors and work order assignees.</p>
                </div>
                <button
                  onClick={() => setShowAddInstModal(true)}
                  style={{
                    background: '#0891b2',
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
                    boxShadow: '0 4px 14px rgba(8, 145, 178, 0.3)',
                  }}
                >
                  <Plus size={18} /> + Add Installer
                </button>
              </div>

              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '16px 20px' }}>Installer Name</th>
                      <th style={{ padding: '16px 20px' }}>Company / Subcontractor</th>
                      <th style={{ padding: '16px 20px' }}>Contact</th>
                      <th style={{ padding: '16px 20px' }}>1-Click Login</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstallers.map((inst) => (
                      <tr key={inst._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#7c3aed20', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {inst.fullName?.[0] || 'I'}
                            </div>
                            <div>{inst.fullName}</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>{inst.companyName || 'Neha Solar'}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div>{inst.email}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{inst.mobile || '—'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <button
                            onClick={() => handleLoginAsInstaller(inst)}
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <ExternalLink size={13} /> Installer App
                          </button>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEdit(inst)}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInstaller(inst._id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInstallers.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No certified installers registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMPANY PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#fff' }}>EPC Partner Technical Profile</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>EPC Enterprise Name</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{currentUser?.companyName || currentUser?.fullName}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Partner Code</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#22d3ee', marginTop: '4px' }}>{currentUser?.code || 'PRT-101-01'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Operational Territory</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{currentUser?.territory || 'Delhi NCR Region'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Commissioning Capacity</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>MNRE Approved EPC Contractor</div>
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

      {/* Modal: Add Installer */}
      {showAddInstModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Register Certified Installer</h3>

            <form onSubmit={handleCreateInstaller}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Technician Full Name</label>
                <input
                  type="text"
                  required
                  value={instForm.fullName}
                  onChange={(e) => setInstForm({ ...instForm, fullName: e.target.value })}
                  placeholder="e.g. Vikram Singh"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Login Email</label>
                <input
                  type="email"
                  required
                  value={instForm.email}
                  onChange={(e) => setInstForm({ ...instForm, email: e.target.value })}
                  placeholder="e.g. installer@nehasolar.com"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Mobile Number</label>
                <input
                  type="text"
                  value={instForm.mobile}
                  onChange={(e) => setInstForm({ ...instForm, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Company / Subcontractor</label>
                <input
                  type="text"
                  value={instForm.companyName}
                  onChange={(e) => setInstForm({ ...instForm, companyName: e.target.value })}
                  placeholder="e.g. Neha Solar"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Password</label>
                <input
                  type="text"
                  value={instForm.password}
                  onChange={(e) => setInstForm({ ...instForm, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {instMsg && <div style={{ marginBottom: '14px', fontSize: '13px', color: '#ef4444' }}>{instMsg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddInstModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0891b2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Save Installer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Installer */}
      {editInst && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Edit Installer: {editInst.fullName}</h3>

            <form onSubmit={handleUpdateInstaller}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Mobile</label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '6px' }}>Password</label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #f59e0b50', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {editMsg && <div style={{ marginBottom: '14px', fontSize: '13px' }}>{editMsg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditInst(null)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0891b2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EPC PARTNER COMPREHENSIVE FEASIBILITY & DOCUMENT AUDIT MODAL ==================== */}
      {feasibilityApp && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(3, 7, 18, 0.88)', 
            backdropFilter: 'blur(8px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 999, 
            padding: '16px' 
          }}
        >
          <div 
            style={{ 
              background: '#0f172a', 
              border: '1px solid rgba(56, 189, 248, 0.25)', 
              borderRadius: '20px', 
              maxWidth: '1120px', 
              width: '100%', 
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(8, 145, 178, 0.15)',
              overflow: 'hidden'
            }}
          >
            {/* MODAL HEADER */}
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #131d33 0%, #0d1527 100%)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(8, 145, 178, 0.2)', color: '#22d3ee', border: '1px solid rgba(8, 145, 178, 0.4)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {feasibilityApp.registrationId}
                    </span>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Technical Engineering & Document Audit Desk
                    </h2>
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontWeight: 700,
                        background: feasibilityApp.technicalFeasibility?.status === 'Feasibility_Approved' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                        color: feasibilityApp.technicalFeasibility?.status === 'Feasibility_Approved' ? '#34d399' : '#fbbf24',
                        border: `1px solid ${feasibilityApp.technicalFeasibility?.status === 'Feasibility_Approved' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                      }}
                    >
                      {feasibilityApp.technicalFeasibility?.status || 'Feasibility Review Pending'}
                    </span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
                    <span><strong style={{ color: '#fff' }}>Applicant:</strong> {feasibilityApp.fullName}</span>
                    <span><strong style={{ color: '#fff' }}>CA No:</strong> {feasibilityApp.consumerNo || 'N/A'}</span>
                    <span><strong style={{ color: '#fff' }}>Load:</strong> {feasibilityApp.sanctionedLoad || '3'} kW ({feasibilityApp.category || 'Domestic'})</span>
                    <span><strong style={{ color: '#fff' }}>Roof:</strong> {feasibilityApp.rooftopArea || '450'} sq ft ({feasibilityApp.roofType || 'RCC'})</span>
                    <span><strong style={{ color: '#fff' }}>System:</strong> {feasibilityApp.proposedCapacity || '3.3'} kWp Proposed</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFeasibilityApp(null)}
                  style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Close inspection"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TAB SELECTOR */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFeasibilityTab('documents')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    background: feasibilityTab === 'documents' ? 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' : 'rgba(255, 255, 255, 0.05)',
                    color: feasibilityTab === 'documents' ? '#fff' : '#94a3b8',
                    boxShadow: feasibilityTab === 'documents' ? '0 4px 12px rgba(8, 145, 178, 0.35)' : 'none'
                  }}
                >
                  <FileCheck size={15} /> 10-Point Document Audit Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setFeasibilityTab('site')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    background: feasibilityTab === 'site' ? 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' : 'rgba(255, 255, 255, 0.05)',
                    color: feasibilityTab === 'site' ? '#fff' : '#94a3b8',
                    boxShadow: feasibilityTab === 'site' ? '0 4px 12px rgba(8, 145, 178, 0.35)' : 'none'
                  }}
                >
                  <Navigation size={15} /> Rooftop Satellite & On-Site Engineering Photos
                </button>
                <button
                  type="button"
                  onClick={() => setFeasibilityTab('customer')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    background: feasibilityTab === 'customer' ? 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' : 'rgba(255, 255, 255, 0.05)',
                    color: feasibilityTab === 'customer' ? '#fff' : '#94a3b8',
                    boxShadow: feasibilityTab === 'customer' ? '0 4px 12px rgba(8, 145, 178, 0.35)' : 'none'
                  }}
                >
                  <User size={15} /> Customer, DBT Subsidy & Discom Info
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* TAB 1: 10-POINT DOCUMENT AUDIT */}
              {feasibilityTab === 'documents' && (
                <div>
                  <div style={{ background: 'rgba(8, 145, 178, 0.1)', border: '1px solid rgba(8, 145, 178, 0.25)', borderRadius: '12px', padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldCheck size={20} color="#22d3ee" />
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        <strong style={{ color: '#fff' }}>EPC Partner Audit Desk:</strong> Review all 10 customer KYC documents, electricity consumer bills, and land title records. Verify or reject individual fields before granting structural approval.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const allApproved = {};
                          ['aadhaarCard', 'panCard', 'electricityBill', 'bankPassbook', 'propertyDeed', 'rooftopGpsPhoto'].forEach((k) => {
                            allApproved[k] = { status: 'Verified', remarks: 'Verified by Solarize EPC partner technical audit' };
                          });
                          setDocAudits(allApproved);
                        }}
                        style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✓ Mark All As Verified
                      </button>
                    </div>
                  </div>

                  <DocumentComparisonCards
                    application={feasibilityApp}
                    isReviewer={true}
                    documentAudits={docAudits}
                    onAuditChange={handleDocAuditChange}
                  />
                </div>
              )}

              {/* TAB 2: ROOFTOP SATELLITE & FIELD PHOTOS */}
              {feasibilityTab === 'site' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* SATELLITE MAP CARD */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Navigation size={18} color="#06b6d4" /> Live Rooftop Satellite Geo-Tagging & Area
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                          Coordinates: <strong style={{ color: '#38bdf8' }}>{feasibilityApp.documents?.satelliteMap?.coordinates?.lat || feasibilityApp.documents?.rooftopGpsPhoto?.gpsLatitude || '28.7155° N'}</strong>, <strong style={{ color: '#38bdf8' }}>{feasibilityApp.documents?.satelliteMap?.coordinates?.lng || feasibilityApp.documents?.rooftopGpsPhoto?.gpsLongitude || '77.1292° E'}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const lat = feasibilityApp.documents?.satelliteMap?.coordinates?.lat || feasibilityApp.documents?.rooftopGpsPhoto?.gpsLatitude || '28.7155';
                          const lng = feasibilityApp.documents?.satelliteMap?.coordinates?.lng || feasibilityApp.documents?.rooftopGpsPhoto?.gpsLongitude || '77.1292';
                          window.open(`https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`, '_blank');
                        }}
                        style={{ background: 'rgba(8, 145, 178, 0.2)', border: '1px solid rgba(8, 145, 178, 0.4)', color: '#22d3ee', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ExternalLink size={13} /> Open Live in Google Maps
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
                      <div 
                        style={{ height: '240px', background: '#020617', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
                        onClick={() => {
                          const mapImg = feasibilityApp.documents?.satelliteMap?.fileUrl || feasibilityApp.documents?.satelliteMap?.staticMapUrl || feasibilityApp.documents?.rooftopGpsPhoto?.fileUrl || feasibilityApp.documents?.rooftopPhoto?.fileUrl;
                          if (mapImg) setActivePhotoPreview(mapImg);
                        }}
                      >
                        {feasibilityApp.documents?.satelliteMap?.fileUrl || feasibilityApp.documents?.satelliteMap?.staticMapUrl || feasibilityApp.documents?.rooftopGpsPhoto?.fileUrl ? (
                          <img
                            src={feasibilityApp.documents?.satelliteMap?.fileUrl || feasibilityApp.documents?.satelliteMap?.staticMapUrl || feasibilityApp.documents?.rooftopGpsPhoto?.fileUrl}
                            alt="Satellite Rooftop"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Navigation size={36} color="#0891b2" />
                            <div style={{ marginTop: '8px', fontSize: '13px' }}>Satellite Map GPS Geo-Pinned</div>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Maximize2 size={11} /> Click to Expand
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: '#0b1120', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Rooftop Area</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{feasibilityApp.rooftopArea || 450} sq ft</div>
                        </div>
                        <div style={{ background: '#0b1120', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Roof Structure Type</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{feasibilityApp.roofType || 'RCC Concrete Slab'}</div>
                        </div>
                        <div style={{ background: '#0b1120', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Feasible Capacity</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{feasibilityApp.proposedCapacity || 3.3} kWp Solar</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FIELD SURVEY CAMERA PHOTO GALLERY */}
                  <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={18} color="#06b6d4" /> Field Survey Live Site Photos ({feasibilityApp.fullName})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      {[
                        { title: 'Rooftop Survey Photo', obj: feasibilityApp.documents?.rooftopPhoto || feasibilityApp.documents?.rooftopGpsPhoto, desc: 'Roof structural integrity & shadow analysis' },
                        { title: 'Satellite Marker Snapshot', obj: feasibilityApp.documents?.satelliteMap, desc: 'Google hybrid marked boundary screenshot' },
                        { title: 'Electricity Discom Meter', obj: feasibilityApp.documents?.meterPhoto, desc: 'Existing meter reading & phase check' },
                        { title: 'Distribution Box (DB)', obj: feasibilityApp.documents?.distributionBoxPhoto, desc: 'Proposed AC/DC cabling & breaker entry' },
                        { title: 'Earthing Pit Location', obj: feasibilityApp.documents?.earthingPitPhoto, desc: 'Grounding electrode & chemical pit area' },
                        { title: 'Building Elevation', obj: feasibilityApp.documents?.buildingElevationPhoto, desc: 'Ladder access & cable riser path' },
                      ].map((card, idx) => {
                        const url = typeof card.obj === 'object' ? (card.obj?.fileUrl || card.obj?.url || card.obj?.staticMapUrl) : card.obj;
                        return (
                          <div 
                            key={idx}
                            style={{ 
                              background: '#131b2e', 
                              border: '1px solid rgba(255, 255, 255, 0.08)', 
                              borderRadius: '12px', 
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <div 
                              style={{ 
                                height: '140px', 
                                background: '#0b1120', 
                                position: 'relative', 
                                cursor: url ? 'pointer' : 'default',
                                overflow: 'hidden'
                              }}
                              onClick={() => url && setActivePhotoPreview(url)}
                            >
                              {url ? (
                                <img src={url} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                  <Camera size={26} />
                                  <span style={{ fontSize: '11px', marginTop: '4px' }}>Field photo captured</span>
                                </div>
                              )}
                              {url && (
                                <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', color: '#fff', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Eye size={10} /> View
                                </div>
                              )}
                            </div>
                            <div style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>{card.title}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{card.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOMER & ELECTRICAL PROFILE */}
              {feasibilityTab === 'customer' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {/* CUSTOMER & DISCOM */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} /> Electricity Connection & DISCOM Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Consumer Account (CA) No:</span>
                        <strong style={{ color: '#f59e0b' }}>{feasibilityApp.consumerNo}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>DISCOM Provider:</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{feasibilityApp.discomName || 'State Power Distribution Corp'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Sanctioned Electrical Load:</span>
                        <strong style={{ color: '#fff' }}>{feasibilityApp.sanctionedLoad || '3'} kW</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Connection Category:</span>
                        <span style={{ color: '#cbd5e1' }}>{feasibilityApp.category || 'Domestic / Residential (DS-II)'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Average Monthly Bill:</span>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>₹{feasibilityApp.avgMonthlyBill ? feasibilityApp.avgMonthlyBill.toLocaleString('en-IN') : '3,500'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Installation Address:</span>
                        <span style={{ color: '#cbd5e1', textAlign: 'right', maxWidth: '200px' }}>{feasibilityApp.propertyAddress || feasibilityApp.districtCity}</span>
                      </div>
                    </div>
                  </div>

                  {/* BANK SUBSIDY & DBT */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Banknote size={16} /> PM Surya Ghar DBT Subsidy Account
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Beneficiary Name:</span>
                        <strong style={{ color: '#fff' }}>{feasibilityApp.bankDetails?.accountHolderName || feasibilityApp.fullName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Bank Name:</span>
                        <span style={{ color: '#cbd5e1' }}>{feasibilityApp.bankDetails?.bankName || 'State Bank of India'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Account Number:</span>
                        <strong style={{ color: '#fff', letterSpacing: '0.5px' }}>{feasibilityApp.bankDetails?.accountNumber || '•••• •••• 4589'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>IFSC Code:</span>
                        <strong style={{ color: '#38bdf8' }}>{feasibilityApp.bankDetails?.ifscCode || 'SBIN0001234'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>DBT Subsidy Eligibility:</span>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>₹78,000 Direct Credit Approved</span>
                      </div>
                    </div>
                  </div>

                  {/* SURVEYOR & DIGITAL SIGNATURES */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px', gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} /> Field Surveyor Declaration & Digital Signatures
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      <div style={{ background: '#0b1120', padding: '12px 14px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Survey Agent (Field Representative)</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '3px' }}>{feasibilityApp.agentName || 'Rakesh'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Distributor: Nandani Enterprise</div>
                      </div>

                      <div style={{ background: '#0b1120', padding: '12px 14px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Applicant Consumer Signature</div>
                        {feasibilityApp.applicantSignature || feasibilityApp.signatures?.applicantSignature ? (
                          <div style={{ height: '60px', background: '#fff', borderRadius: '6px', overflow: 'hidden', padding: '4px' }}>
                            <img src={feasibilityApp.applicantSignature || feasibilityApp.signatures?.applicantSignature} alt="Applicant Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        ) : (
                          <div style={{ height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                            Digitally Attested (Aadhaar e-Sign)
                          </div>
                        )}
                      </div>

                      <div style={{ background: '#0b1120', padding: '12px 14px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Surveyor / Agent Attestation</div>
                        {feasibilityApp.agentSignature || feasibilityApp.signatures?.agentSignature ? (
                          <div style={{ height: '60px', background: '#fff', borderRadius: '6px', overflow: 'hidden', padding: '4px' }}>
                            <img src={feasibilityApp.agentSignature || feasibilityApp.signatures?.agentSignature} alt="Agent Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        ) : (
                          <div style={{ height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                            Field Verified on Site
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER: ENGINEERING DECISION BAR */}
            <div style={{ padding: '18px 24px', background: '#0d1527', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {feasibilityMsg && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: feasibilityMsg.includes('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${feasibilityMsg.includes('✅') ? '#10b981' : '#ef4444'}`, color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                  {feasibilityMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) auto', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                    EPC Partner Feasibility Assessment & Engineering Notes
                  </label>
                  <textarea
                    rows={2}
                    value={feasibilityNotes}
                    onChange={(e) => setFeasibilityNotes(e.target.value)}
                    placeholder="Enter rooftop structural remarks, shadow obstacle clearance, and proposed solar commissioning capacity..."
                    style={{ width: '100%', padding: '10px 12px', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setFeasibilityApp(null)}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '11px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={submittingFeasibility}
                    onClick={() => {
                      const reason = window.prompt('Please enter the reason for rejecting feasibility (e.g., roof structure damaged / severe shadow obstacles):', 'Rooftop unsuitable or structural constraint identified.');
                      if (reason !== null) {
                        setRejectionReason(reason);
                        handleFeasibilitySubmit('Feasibility_Rejected');
                      }
                    }}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '11px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <XCircle size={15} /> ✕ Reject Feasibility
                  </button>
                  <button
                    type="button"
                    disabled={submittingFeasibility}
                    onClick={() => handleFeasibilitySubmit('Feasibility_Approved')}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                  >
                    <CheckCircle2 size={16} /> ✓ Approve Feasibility & Ready for Installer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN IMAGE PREVIEW */}
      {activePhotoPreview && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setActivePhotoPreview(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={activePhotoPreview} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} />
            <button
              onClick={() => setActivePhotoPreview(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Assign Installer Modal */}
      {assignApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700 }}>Assign Field Installer</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 18px' }}>
              Allot rooftop structure and panel commissioning work order for <strong>{assignApp.registrationId}</strong>.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Select Certified Installer</label>
              <select
                value={selectedInstallerId}
                onChange={(e) => setSelectedInstallerId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
              >
                <option value="">-- Choose Installer --</option>
                {installers.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.fullName} ({inst.companyName || inst.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setAssignApp(null)}
                style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignInstallerSubmit}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Assign Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
