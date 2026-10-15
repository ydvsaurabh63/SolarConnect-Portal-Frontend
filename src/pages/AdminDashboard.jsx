import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Briefcase,
  Users,
  Sun,
  Banknote,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  Building,
  FileText,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronRight,
  LogOut,
  MapPin,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Copy,
  Check,
  Server,
  Layers,
  Wrench,
  ShieldCheck,
  LayoutDashboard,
  Zap,
  Shield,
  AlertTriangle,
  Lock,
  UserCheck,
  Clock,
  FileCheck,
} from 'lucide-react';
import VerificationTrackerModal from '../components/VerificationTrackerModal';
import DocumentComparisonCards from '../components/DocumentComparisonCards';

// Helper to remove any redundant bracketed suffixes (e.g. "(Solar Consumer)", "(Field Agent)")
const cleanName = (str) => (str || '').replace(/\s*\([^)]*\)/g, '').trim();

export default function AdminDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'distributors' | 'partners' | 'financers' | 'consumers'
  const [searchQuery, setSearchQuery] = useState('');
  const [consumerFilter, setConsumerFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [viewTrackingApp, setViewTrackingApp] = useState(null);

  const [distributors, setDistributors] = useState([]);
  const [partners, setPartners] = useState([]);
  const [financers, setFinancers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create Subordinate Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetCreateRole, setTargetCreateRole] = useState('distributor'); // 'distributor' | 'partner' | 'financer'
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    companyName: '',
    territory: '',
  });
  const [createMsg, setCreateMsg] = useState('');

  // Edit Modal State
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    territory: '',
    companyName: '',
  });
  const [editMsg, setEditMsg] = useState('');

  // View Distributor Details Modal State
  const [viewDistributorModal, setViewDistributorModal] = useState(null);

  // Assign Partner to Distributor Modal State
  const [distributorForPartnerAssign, setDistributorForPartnerAssign] = useState(null);
  const [selectedPartnerForDist, setSelectedPartnerForDist] = useState('');

  // Legacy Single Lead Partner Assign
  const [assignModalApp, setAssignModalApp] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  // Consumer Full Audit Modal State
  const [docAudits, setDocAudits] = useState({});
  const [adminAuditConsumer, setAdminAuditConsumer] = useState(null);
  const [auditPartnerId, setAuditPartnerId] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditMessage, setAuditMessage] = useState('');

  useEffect(() => {
    if (adminAuditConsumer && adminAuditConsumer.documents) {
      const initial = {};
      const docs = adminAuditConsumer.documents;
      ['aadhaarCard', 'panCard', 'bijliBill', 'bankPassbook', 'jaminRasid', 'rooftopGpsPhoto'].forEach((k) => {
        initial[k] = {
          status: docs[k]?.status || 'Verified',
          remarks: docs[k]?.remarks || '',
        };
      });
      setDocAudits(initial);
    }
  }, [adminAuditConsumer]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [distRes, partRes, finRes, appsRes] = await Promise.all([
        api.getUsers({ role: 'distributor' }),
        api.getUsers({ role: 'partner' }),
        api.getUsers({ role: 'financer' }),
        api.getSubmissionLog(),
      ]);

      if (distRes.success) setDistributors(distRes.users || []);
      if (partRes.success) setPartners(partRes.users || []);
      if (finRes.success) setFinancers(finRes.users || []);
      if (appsRes.success) setApplications(appsRes.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/admin/login');
  };

  const togglePasswordReveal = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateSubordinate = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      const res = await api.createUser({
        ...createForm,
        password: createForm.password || 'solar@123',
        role: targetCreateRole,
        createdById: currentUser?._id,
        createdByName: currentUser?.fullName || 'Vijay Kumar Singh',
        adminId: currentUser?._id,
        adminName: currentUser?.fullName,
        adminCode: currentUser?.code || currentUser?.executiveId || 'ADM-101',
      });

      if (res.success) {
        setShowAddModal(false);
        setCreateForm({ fullName: '', email: '', mobile: '', password: '', companyName: '', territory: '' });
        loadData();
      } else {
        setCreateMsg('❌ ' + (res.message || 'Error creating user'));
      }
    } catch (err) {
      setCreateMsg('❌ Error creating user');
    }
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      password: '', // Never pre-fill password into form
      territory: user.territory || '',
      companyName: user.companyName || '',
    });
    setEditMsg('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditMsg('');
    try {
      const payload = { ...editForm };
      if (!payload.password || !payload.password.trim()) {
        delete payload.password; // Do not overwrite with empty password
      }
      const res = await api.updateUser(editUser._id, payload);
      if (res.success) {
        setEditUser(null);
        loadData();
      } else {
        setEditMsg('❌ ' + (res.message || 'Failed to update user'));
      }
    } catch (err) {
      setEditMsg('❌ Error updating user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this stakeholder?')) {
      await api.deleteUser(id);
      loadData();
    }
  };

  // 1-Click Login As in a New Tab
  const handleLoginAs = (user) => {
    const role = user.role;
    const url = `${window.location.origin}/${role}/dashboard?impersonate=${user._id}&by=admin`;
    window.open(url, '_blank');
  };

  // Toggle Distributor Routing Mode (AUTO vs MANUAL)
  const handleToggleDistributorMode = async (dist) => {
    const currentMode = dist.verificationMode || 'MANUAL';
    const newMode = currentMode === 'AUTO' ? 'MANUAL' : 'AUTO';

    // Optimistic local update
    setDistributors((prev) =>
      prev.map((d) => (d._id === dist._id ? { ...d, verificationMode: newMode } : d))
    );

    try {
      await api.updateUser(dist._id, { verificationMode: newMode });
    } catch (err) {
      console.error('Failed to update verification mode:', err);
      loadData();
    }
  };

  // Open modal to assign partner to a specific distributor
  const handleOpenAssignDistributorPartner = (dist) => {
    setDistributorForPartnerAssign(dist);
    setSelectedPartnerForDist(dist.assignedPartnerId || (partners[0]?._id || ''));
  };

  // Save Partner Assignment for Distributor
  const handleSaveDistributorPartner = async () => {
    if (!distributorForPartnerAssign || !selectedPartnerForDist) return;
    const partner = partners.find((p) => p._id === selectedPartnerForDist);
    if (!partner) return;

    try {
      await api.updateUser(distributorForPartnerAssign._id, {
        assignedPartnerId: partner._id,
        assignedPartnerName: partner.companyName || partner.fullName,
      });
      setDistributorForPartnerAssign(null);
      setSelectedPartnerForDist('');
      loadData();
    } catch (err) {
      console.error('Failed to assign partner to distributor:', err);
    }
  };

  // Open Consumer Audit Modal
  const handleOpenConsumerAudit = (consumer) => {
    setAdminAuditConsumer(consumer);
    setShowRejectForm(false);
    setRejectReason('');
    setAuditMessage('');
    // Pre-select partner: if application already has partnerDetails or distributor has assigned partner or first partner
    const defaultPartner =
      consumer.partnerDetails?.partnerId ||
      distributors.find((d) => d._id === consumer.distributorId)?.assignedPartnerId ||
      partners[0]?._id ||
      '';
    setAuditPartnerId(defaultPartner);
  };

  // Admin Audit Approve
  const handleAdminApproveConsumer = async () => {
    if (!adminAuditConsumer) return;
    setAuditSubmitting(true);
    setAuditMessage('');
    try {
      const partner = partners.find((p) => p._id === auditPartnerId);
      const res = await api.adminVerify(adminAuditConsumer._id, {
        action: 'APPROVE',
        partnerId: partner?._id || '',
        partnerName: partner ? (partner.companyName || partner.fullName) : '',
        verifiedBy: currentUser?.fullName || 'Vijay Kumar Singh',
      });
      if (res.success) {
        setAuditMessage('✅ Application successfully approved and assigned to Partner!');
        setTimeout(() => {
          setAdminAuditConsumer(null);
          loadData();
        }, 1200);
      } else {
        setAuditMessage('❌ ' + (res.message || 'Failed to approve application'));
      }
    } catch (err) {
      setAuditMessage('❌ Error during approval: ' + err.message);
    } finally {
      setAuditSubmitting(false);
    }
  };

  // Admin Audit Reject
  const handleAdminRejectConsumer = async (isFullReject = false) => {
    if (!adminAuditConsumer) return;
    let finalReason = rejectReason.trim();
    const rejectedItems = Object.entries(docAudits)
      .filter(([_, val]) => val.status === 'Rejected')
      .map(([k, val]) => `${k.replace('Card', '').replace('Bill', ' Bill').replace('Passbook', ' Passbook').replace('Rasid', ' Deed')}: ${val.remarks || 'Needs re-upload'}`);

    if (!finalReason && rejectedItems.length > 0) {
      finalReason = 'Specific correction required in: ' + rejectedItems.join('; ');
    }
    if (!finalReason) {
      finalReason = isFullReject ? 'Entire application rejected by State Admin for full re-survey' : 'Flagged document(s) require correction';
    }

    setAuditSubmitting(true);
    setAuditMessage('');
    try {
      const auditsToSend = isFullReject
        ? {
            aadhaarCard: { status: 'Rejected', remarks: finalReason },
            panCard: { status: 'Rejected', remarks: finalReason },
            bijliBill: { status: 'Rejected', remarks: finalReason },
            bankPassbook: { status: 'Rejected', remarks: finalReason },
            jaminRasid: { status: 'Rejected', remarks: finalReason },
            rooftopGpsPhoto: { status: 'Rejected', remarks: finalReason },
          }
        : docAudits;

      const res = await api.adminVerify(adminAuditConsumer._id, {
        action: 'REJECT',
        rejectionReason: finalReason,
        rejectionScope: isFullReject ? 'FULL' : 'PARTIAL',
        documentAudits: auditsToSend,
        verifiedBy: currentUser?.fullName || 'Vijay Kumar Singh',
      });
      if (res.success) {
        setAuditMessage(isFullReject 
          ? '❌ Full Application Rejected by Admin. Entire survey requires re-submission.' 
          : '⚠️ Specific sections rejected. Notification sent to Agent & Consumer to re-upload only rejected documents.');
        setTimeout(() => {
          setAdminAuditConsumer(null);
          loadData();
        }, 1200);
      } else {
        setAuditMessage('❌ ' + (res.message || 'Failed to reject application'));
      }
    } catch (err) {
      setAuditMessage('❌ Error during rejection: ' + err.message);
    } finally {
      setAuditSubmitting(false);
    }
  };

  const handleVerifyStatus = async (appId, newStatus) => {
    const remarks = prompt('Enter verification remarks (optional):') || 'Admin verified';
    await api.verifyRegistration(appId, newStatus, remarks, currentUser?.fullName);
    loadData();
  };

  const handleAssignPartner = async () => {
    if (!selectedPartnerId || !assignModalApp) return;
    const partner = partners.find((p) => p._id === selectedPartnerId);
    if (!partner) return;

    await api.assignPartner(assignModalApp._id, partner._id, partner.companyName || partner.fullName);
    setAssignModalApp(null);
    setSelectedPartnerId('');
    loadData();
  };

  // Search Filtered Data
  const filteredDistributors = useMemo(() => {
    return distributors.filter((d) =>
      d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.territory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assignedPartnerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [distributors, searchQuery]);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) =>
      p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partners, searchQuery]);

  const filteredFinancers = useMemo(() => {
    return financers.filter((f) =>
      f.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [financers, searchQuery]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        app.registrationId?.toLowerCase().includes(q) ||
        app.fullName?.toLowerCase().includes(q) ||
        app.districtCity?.toLowerCase().includes(q) ||
        app.consumerNo?.toLowerCase().includes(q) ||
        app.agentName?.toLowerCase().includes(q) ||
        app.agentCode?.toLowerCase().includes(q) ||
        app.distributorName?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (consumerFilter === 'PENDING') {
        return (
          app.adminVerification?.status === 'Pending' ||
          app.overallStatus === 'Distributor_Verified' ||
          app.overallStatus === 'Pending_Distributor'
        );
      }
      if (consumerFilter === 'APPROVED') {
        return (
          app.adminVerification?.status === 'Approved' ||
          app.overallStatus === 'Assigned_To_Partner'
        );
      }
      if (consumerFilter === 'REJECTED') {
        return (
          app.adminVerification?.status === 'Rejected' ||
          app.distributorVerification?.status === 'Rejected' ||
          app.overallStatus?.startsWith('Rejected')
        );
      }
      return true;
    });
  }, [applications, searchQuery, consumerFilter]);

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
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Building size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                SolarConnect
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Admin
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(8, 47, 73, 0.4) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
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
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {currentUser?.fullName?.[0] || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || 'Admin'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
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
                background: activeTab === 'overview' ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'overview' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={17} color={activeTab === 'overview' ? '#fff' : '#38bdf8'} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('distributors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'distributors' ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'distributors' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={17} color={activeTab === 'distributors' ? '#fff' : '#f59e0b'} />
                <span>Distributor</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {distributors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'partners' ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'partners' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sun size={17} color={activeTab === 'partners' ? '#fff' : '#22d3ee'} />
                <span>Partner</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {partners.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('financers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'financers' ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'financers' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Banknote size={17} color={activeTab === 'financers' ? '#fff' : '#4ade80'} />
                <span>Financer</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {financers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('consumers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'consumers' ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: activeTab === 'consumers' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={17} color={activeTab === 'consumers' ? '#fff' : '#38bdf8'} />
                <span>Consumer</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {applications.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
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
        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <div
            style={{
              background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
              color: '#fff',
              padding: '9px 28px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>👁️ <strong>IMPERSONATION SESSION:</strong> You are viewing this portal as <strong>{currentUser.fullName}</strong> (STATE ADMIN), delegated by {currentUser.impersonatedBy?.toUpperCase() || 'SUPERADMIN'}.</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <span>Admin</span>
            <ChevronRight size={14} />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'distributors' && 'Distributor'}
              {activeTab === 'partners' && 'Partner'}
              {activeTab === 'financers' && 'Financer'}
              {activeTab === 'consumers' && 'Consumer'}
            </span>
          </div>

          <div style={{ width: '380px', position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, CA, mobile, territory..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: '#070b13',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {['distributors', 'partners', 'financers'].includes(activeTab) && (
              <button
                onClick={() => {
                  setTargetCreateRole(activeTab === 'distributors' ? 'distributor' : activeTab === 'partners' ? 'partner' : 'financer');
                  setShowAddModal(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                }}
              >
                <Plus size={16} /> + Add {activeTab === 'distributors' ? 'Distributor' : activeTab === 'partners' ? 'Partner' : 'Financer'}
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Body */}
        <main style={{ padding: '28px', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* 4 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div
              onClick={() => setActiveTab('distributors')}
              style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderTop: '3px solid #f59e0b', borderRadius: '16px', padding: '22px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Distributors</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>{distributors.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Active distributors</div>
            </div>

            <div
              onClick={() => setActiveTab('partners')}
              style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderTop: '3px solid #22d3ee', borderRadius: '16px', padding: '22px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Partners</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#22d3ee', marginTop: '6px' }}>{partners.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Active EPC partners</div>
            </div>

            <div
              onClick={() => setActiveTab('financers')}
              style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderTop: '3px solid #4ade80', borderRadius: '16px', padding: '22px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Financers</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#4ade80', marginTop: '6px' }}>{financers.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Active loan partners</div>
            </div>

            <div
              onClick={() => setActiveTab('consumers')}
              style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderTop: '3px solid #38bdf8', borderRadius: '16px', padding: '22px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Consumers</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>{applications.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Total customer applications</div>
            </div>
          </div>

          {/* Quick Actions Bar inside Overview */}
          {activeTab === 'overview' && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>Quick Actions</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>Create new regional subordinates or audit submitted solar applications.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setTargetCreateRole('distributor');
                    setShowAddModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  }}
                >
                  <Plus size={16} /> + Add Distributor
                </button>
                <button
                  onClick={() => {
                    setTargetCreateRole('partner');
                    setShowAddModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <Plus size={16} /> + Add EPC Partner
                </button>
                <button
                  onClick={() => {
                    setTargetCreateRole('financer');
                    setShowAddModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <Plus size={16} /> + Add Financer
                </button>
                <button
                  onClick={() => setActiveTab('consumers')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
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
                  <Users size={15} /> Consumer Desk ({applications.length})
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            {/* Tab 0: Overview Workspace Table */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Recent Consumer Intake</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Latest rooftop solar survey leads pending state administrative verification or EPC assignment.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('consumers')}
                    style={{ background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.3)', color: '#38bdf8', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All ({applications.length})
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Consumer Reg ID</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Applicant & Mobile</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>District</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Verification</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>EPC Partner</th>
                        <th style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.slice(0, 5).map((app) => (
                        <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {app.registrationId}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div
                              onClick={() => handleOpenConsumerAudit(app)}
                              title="Click to audit consumer details & documents"
                              style={{ fontWeight: 700, color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {cleanName(app.fullName)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>CA: {app.consumerNo || '—'}</span>
                              <span style={{ color: '#475569' }}>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={11} color="#38bdf8" />
                                {app.mobile}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{app.districtCity}</td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            {app.adminVerification?.status === 'Approved' ? (
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                Approved
                              </span>
                            ) : app.adminVerification?.status === 'Rejected' ? (
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                Rejected
                              </span>
                            ) : app.distributorVerification?.status === 'Verified' ? (
                              <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} />
                                Dist. Verified
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                                Pending Check
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            {app.partnerDetails?.partnerName ? (
                              <div style={{ fontWeight: 600, color: '#38bdf8' }}>{cleanName(app.partnerDetails.partnerName)}</div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleOpenConsumerAudit(app)}
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 1: Distributors */}
            {activeTab === 'distributors' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Distributor Agency</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Contact</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Territory</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Assigned Partner</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Routing Mode</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Login</th>
                      <th style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDistributors.map((dist) => {
                      const isAuto = dist.verificationMode === 'AUTO';
                      return (
                        <tr key={dist._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '18px 22px' }}>
                            <div
                              onClick={() => setViewDistributorModal(dist)}
                              title="Click to view distributor details"
                              style={{
                                fontWeight: 700,
                                color: '#38bdf8',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>{dist.fullName}</span>
                              <ExternalLink size={12} color="#38bdf8" />
                            </div>
                            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>
                              {dist.companyName || 'Solar Agency'}
                            </div>
                          </td>
                          <td style={{ padding: '18px 22px' }}>
                            <div style={{ color: '#cbd5e1' }}>{dist.email}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{dist.mobile || '—'}</div>
                          </td>
                          <td style={{ padding: '18px 22px', whiteSpace: 'nowrap' }}>
                            <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                              {dist.territory || 'Assigned Area'}
                            </span>
                          </td>
                          {/* Assigned Partner Column */}
                          <td style={{ padding: '18px 22px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div>
                                {dist.assignedPartnerName ? (
                                  <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px' }}>
                                    {dist.assignedPartnerName}
                                  </div>
                                ) : (
                                  <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                                    Not Assigned
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleOpenAssignDistributorPartner(dist)}
                                title="Assign or Change Partner for this Distributor"
                                style={{
                                  background: 'rgba(2, 132, 199, 0.15)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  color: '#38bdf8',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {dist.assignedPartnerName ? 'Change' : '+ Assign Partner'}
                              </button>
                            </div>
                          </td>
                          {/* Routing Mode Toggle Switch Column (Simple Auto / Manual) */}
                          <td style={{ padding: '18px 22px', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleToggleDistributorMode(dist)}
                              title={`Current: ${isAuto ? 'Auto' : 'Manual'}. Click to switch.`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '7px',
                                padding: '5px 14px',
                                borderRadius: '20px',
                                background: isAuto ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                border: isAuto ? '1px solid #10b981' : '1px solid #f59e0b',
                                color: isAuto ? '#34d399' : '#fbbf24',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: isAuto ? '#10b981' : '#f59e0b',
                                }}
                              />
                              <span>{isAuto ? 'Auto' : 'Manual'}</span>
                            </button>
                          </td>
                          <td style={{ padding: '18px 22px' }}>
                            <button
                              onClick={() => handleLoginAs(dist)}
                              style={{
                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <ExternalLink size={13} /> Login
                            </button>
                          </td>
                          <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleOpenEdit(dist)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(dist._id)}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: EPC Partners */}
            {activeTab === 'partners' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>EPC Partner</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Contact</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Territory</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Login</th>
                      <th style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map((prt) => (
                      <tr key={prt._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '18px 22px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{prt.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#22d3ee' }}>{prt.companyName || 'EPC Solutions'}</div>
                        </td>
                        <td style={{ padding: '18px 22px' }}>
                          <div style={{ color: '#cbd5e1' }}>{prt.email}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{prt.mobile || '—'}</div>
                        </td>
                        <td style={{ padding: '18px 22px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                            {prt.territory || 'Delhi NCR'}
                          </span>
                        </td>
                        <td style={{ padding: '18px 22px' }}>
                          <button
                            onClick={() => handleLoginAs(prt)}
                            style={{
                              background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ExternalLink size={13} /> Login
                          </button>
                        </td>
                        <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEdit(prt)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(prt._id)}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Financers */}
            {activeTab === 'financers' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Financer Bank</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Contact</th>
                      <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Login</th>
                      <th style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinancers.map((fin) => (
                      <tr key={fin._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '18px 22px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{fin.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#4ade80' }}>{fin.companyName || 'Renewable Finance NBFC'}</div>
                        </td>
                        <td style={{ padding: '18px 22px' }}>
                          <div style={{ color: '#cbd5e1' }}>{fin.email}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{fin.mobile || '—'}</div>
                        </td>
                        <td style={{ padding: '18px 22px' }}>
                          <button
                            onClick={() => handleLoginAs(fin)}
                            style={{
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ExternalLink size={13} /> Login
                          </button>
                        </td>
                        <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEdit(fin)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(fin._id)}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '6px 10px', borderRadius: '7px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 4: Consumer Desk & Verification */}
            {activeTab === 'consumers' && (
              <div>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>Consumer Applications</h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Review customer survey submissions and sanction partner installation approvals.</p>
                  </div>
                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setConsumerFilter('ALL')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        background: consumerFilter === 'ALL' ? '#0284c7' : 'rgba(255, 255, 255, 0.06)',
                        color: consumerFilter === 'ALL' ? '#fff' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      All ({applications.length})
                    </button>
                    <button
                      onClick={() => setConsumerFilter('PENDING')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        background: consumerFilter === 'PENDING' ? '#f59e0b' : 'rgba(255, 255, 255, 0.06)',
                        color: consumerFilter === 'PENDING' ? '#000' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Pending Verification ({applications.filter((a) => a.adminVerification?.status === 'Pending' || a.overallStatus === 'Distributor_Verified' || a.overallStatus === 'Pending_Distributor').length})
                    </button>
                    <button
                      onClick={() => setConsumerFilter('APPROVED')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        background: consumerFilter === 'APPROVED' ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                        color: consumerFilter === 'APPROVED' ? '#fff' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Approved ({applications.filter((a) => a.adminVerification?.status === 'Approved' || a.overallStatus === 'Assigned_To_Partner').length})
                    </button>
                    <button
                      onClick={() => setConsumerFilter('REJECTED')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        background: consumerFilter === 'REJECTED' ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
                        color: consumerFilter === 'REJECTED' ? '#fff' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Rejected ({applications.filter((a) => a.adminVerification?.status === 'Rejected' || a.distributorVerification?.status === 'Rejected' || a.overallStatus?.startsWith('Rejected')).length})
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                        <th style={{ padding: '14px 20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Consumer</th>
                        <th style={{ padding: '14px 20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Reg ID & Date</th>
                        <th style={{ padding: '14px 20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Field Agent</th>
                        <th style={{ padding: '14px 20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Distributor</th>
                        <th style={{ padding: '14px 20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '14px 20px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Assigned Partner</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map((app) => (
                        <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div
                              onClick={() => handleOpenConsumerAudit(app)}
                              title="Click to view full consumer profile & documents"
                              style={{ fontWeight: 700, color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                            >
                              {cleanName(app.fullName)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>CA: {app.consumerNo || '—'}</span>
                              <span style={{ color: '#475569' }}>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={11} color="#38bdf8" />
                                {app.mobile}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', fontSize: '13px' }}>
                              {app.registrationId}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              {app.issuedOn ? new Date(app.issuedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '13px' }}>
                              {cleanName(app.agentName || app.executiveName || 'Direct Field')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              {app.agentCode || app.executiveId || 'AGT-101-01'}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: '13px' }}>
                              {cleanName(app.distributorName || 'Nandani Enterprise')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                              📍 {app.areaDistrict || app.districtCity || 'North Delhi'}
                            </div>
                          </td>
                          <td 
                            style={{ padding: '16px 20px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onClick={() => setViewTrackingApp(app)}
                            title="Click to track complete verification lifecycle"
                          >
                            {app.adminVerification?.status === 'Approved' ? (
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                Approved
                              </span>
                            ) : app.adminVerification?.status === 'Rejected' ? (
                              <div>
                                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                  Rejected
                                </span>
                                {app.adminVerification?.rejectionReason && (
                                  <div style={{ fontSize: '10px', color: '#fca5a5', marginTop: '3px', maxWidth: '170px' }}>
                                    Reason: {app.adminVerification.rejectionReason}
                                  </div>
                                )}
                              </div>
                            ) : app.distributorVerification?.status === 'Verified' ? (
                              <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} />
                                Dist. Verified
                              </span>
                            ) : app.distributorVerification?.status === 'Rejected' ? (
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                Dist. Rejected
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                                Pending Check
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            {app.partnerDetails?.partnerName ? (
                              <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '13px' }}>
                                {cleanName(app.partnerDetails.partnerName)}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleOpenConsumerAudit(app)}
                              style={{
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <FileText size={13} /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* -------------------- MODALS -------------------- */}
      {/* Create Subordinate Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                Create New {targetCreateRole === 'distributor' ? 'Area Distributor' : targetCreateRole === 'partner' ? 'EPC Partner' : 'Financer'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubordinate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Stakeholder Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Company / Agency / Bank Name</label>
                <input
                  type="text"
                  value={createForm.companyName}
                  onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                  placeholder="e.g. Nandani Enterprise LLP"
                  style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Mobile</label>
                  <input
                    type="text"
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Territory / Region</label>
                <input
                  type="text"
                  value={createForm.territory}
                  onChange={(e) => setCreateForm({ ...createForm, territory: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Password</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                  style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {createMsg && <div style={{ marginBottom: '14px', color: '#f87171', fontSize: '13px' }}>{createMsg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: '9px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700 }}>Create {targetCreateRole}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>Edit {editUser.fullName}</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Name</label>
                <input type="text" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Company</label>
                <input type="text" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Email</label>
                  <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Mobile</label>
                  <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Territory</label>
                <input type="text" value={editForm.territory} onChange={(e) => setEditForm({ ...editForm, territory: e.target.value })} style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>Change Password (Optional)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current password" style={{ width: '100%', padding: '11px 14px', background: '#070b13', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '9px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              {editMsg && <div style={{ marginBottom: '14px', color: '#f87171', fontSize: '13px' }}>{editMsg}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditUser(null)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: '9px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Partner to Distributor Modal */}
      {distributorForPartnerAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sun size={20} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    Assign Partner to Distributor
                  </h3>
                  <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                    {distributorForPartnerAssign.fullName}
                  </div>
                </div>
              </div>
              <button onClick={() => setDistributorForPartnerAssign(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px', lineHeight: 1.5 }}>
              Choose which certified EPC Partner will receive all consumer survey leads submitted and verified through this distributor.
            </p>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                Select EPC Partner
              </label>
              <select
                value={selectedPartnerForDist}
                onChange={(e) => setSelectedPartnerForDist(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', background: '#070b13', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="">-- Choose Partner --</option>
                {partners.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.companyName || p.fullName} ({p.territory || 'Delhi NCR'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDistributorForPartnerAssign(null)}
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDistributorPartner}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                }}
              >
                Save Partner Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Consumer Audit & 10-Documents Verification Desk Modal */}
      {adminAuditConsumer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
          <div
            style={{
              background: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                    {adminAuditConsumer.fullName}
                  </h2>
                  <span style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    {adminAuditConsumer.registrationId}
                  </span>
                  <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    CA: {adminAuditConsumer.consumerNo || '—'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                  State Administrative Audit Desk • Verify applicant booklet, 10-point documents, and issue installation sanction.
                </div>
              </div>
              <button
                onClick={() => setAdminAuditConsumer(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Lineage Audit Path */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '12px 18px',
                margin: '20px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Field Agent:</span>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{adminAuditConsumer.agentName || adminAuditConsumer.executiveName || 'Direct Field'} ({adminAuditConsumer.agentCode || 'AGT-101-01-01'})</span>
              </div>
              <ChevronRight size={14} color="#64748b" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Distributor Hub:</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{adminAuditConsumer.distributorName || 'Nandani Enterprise'}</span>
              </div>
              <ChevronRight size={14} color="#64748b" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Assigned Partner:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{adminAuditConsumer.partnerDetails?.partnerName || 'Pending Sanction'}</span>
              </div>
            </div>

            {/* 2-Column Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Applicant Profile */}
              <div style={{ background: '#070b13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} /> Consumer Profile & Location
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Mobile:</span> <span style={{ fontWeight: 600, color: '#fff' }}>{adminAuditConsumer.mobile}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Alternate Phone:</span> <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{adminAuditConsumer.alternateNo || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Email:</span> <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{adminAuditConsumer.email || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>District / City:</span> <span style={{ fontWeight: 600, color: '#fff' }}>{adminAuditConsumer.districtCity || adminAuditConsumer.areaDistrict}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Address:</span> <span style={{ fontWeight: 600, color: '#cbd5e1', textAlign: 'right', maxWidth: '170px' }}>{adminAuditConsumer.address || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>PIN Code:</span> <span style={{ fontWeight: 600, color: '#fff' }}>{adminAuditConsumer.pinCode || '110085'}</span></div>
                </div>
              </div>

              {/* Technical Solar Specs */}
              <div style={{ background: '#070b13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sun size={15} /> Solar & Technical Site Specs
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Monthly Electricity Bill:</span> <span style={{ fontWeight: 700, color: '#10b981' }}>₹{adminAuditConsumer.avgMonthlyBill || 0}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Rooftop Usable Area:</span> <span style={{ fontWeight: 700, color: '#fff' }}>{adminAuditConsumer.rooftopArea || 350} Sq Ft</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Roof Type:</span> <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{adminAuditConsumer.roofType || 'RCC Concrete'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Property Ownership:</span> <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{adminAuditConsumer.ownership || 'Owned'} ({adminAuditConsumer.propertyType || 'Residential'})</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Aadhaar Number:</span> <span style={{ fontWeight: 600, color: '#cbd5e1', fontFamily: 'monospace' }}>{adminAuditConsumer.aadhaarNumber || 'Attached in Doc'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>PAN Number:</span> <span style={{ fontWeight: 600, color: '#cbd5e1', fontFamily: 'monospace' }}>{adminAuditConsumer.panNumber || 'Attached in Doc'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>GPS Rooftop Coords:</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {adminAuditConsumer.documents?.rooftopGpsPhoto?.gpsLatitude || '28.6139° N'}, {adminAuditConsumer.documents?.rooftopGpsPhoto?.gpsLongitude || '77.2090° E'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 10-Point Survey Documents Audit with Numbers & Photos Side-by-Side */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={16} color="#f59e0b" /> Mandatory Documents: Number & Photo Side-by-Side Audit
              </h4>
              <DocumentComparisonCards 
                application={adminAuditConsumer} 
                isReviewer={true} 
                documentAudits={docAudits}
                onAuditChange={(docKey, auditVal, all) => setDocAudits(all)}
              />
            </div>

            {/* Verification Status & Administrative Decision Actions */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>State Administrative Verification Action</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Current Status: <strong style={{ color: adminAuditConsumer.adminVerification?.status === 'Approved' ? '#34d399' : adminAuditConsumer.adminVerification?.status === 'Rejected' ? '#f87171' : '#fbbf24' }}>
                      {adminAuditConsumer.adminVerification?.status || 'Pending Admin Sanction'}
                    </strong>
                  </div>
                </div>

                {/* Assigned Partner Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Execute via Partner:</label>
                  <select
                    value={auditPartnerId}
                    onChange={(e) => setAuditPartnerId(e.target.value)}
                    style={{ padding: '8px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                  >
                    {partners.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.companyName || p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {auditMessage && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, background: auditMessage.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: auditMessage.startsWith('✅') ? '#34d399' : '#f87171' }}>
                  {auditMessage}
                </div>
              )}

              {/* Document Audit Summary Checklist & Decision Gate */}
              {(() => {
                const AUDIT_DOC_NAMES = {
                  aadhaarCard: '1. Aadhaar Card (Front/Back)',
                  panCard: '2. PAN Card',
                  bijliBill: '3. Electricity Bill',
                  bankPassbook: '4. Bank Passbook / Cheque',
                  jaminRasid: '5. Land Registry Deed',
                  rooftopGpsPhoto: '6. Rooftop Satellite Map',
                };

                const entries = Object.keys(AUDIT_DOC_NAMES).map((key) => {
                  const audit = docAudits[key] || { status: 'Verified', remarks: '' };
                  return { key, label: AUDIT_DOC_NAMES[key], status: audit.status || 'Verified', remarks: audit.remarks || '' };
                });

                const rejectedDocs = entries.filter((e) => e.status === 'Rejected');
                const verifiedDocs = entries.filter((e) => e.status === 'Verified');
                const rejectedCount = rejectedDocs.length;
                const isAllVerified = rejectedCount === 0 && verifiedDocs.length === entries.length;

                return (
                  <div>
                    {/* Live Audit Status Grid */}
                    <div style={{ marginBottom: '16px', background: '#070b13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#cbd5e1' }}>
                          Administrative Audit Summary ({verifiedDocs.length}/{entries.length} Verified)
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#065f4630', color: '#34d399', border: '1px solid #05966950' }}>
                            ✓ {verifiedDocs.length} Accepted
                          </span>
                          {rejectedCount > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#ef444425', color: '#f87171', border: '1px solid #ef444450' }}>
                              ✕ {rejectedCount} Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                        {entries.map((item) => {
                          const isRej = item.status === 'Rejected';
                          return (
                            <div
                              key={item.key}
                              style={{
                                background: isRej ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid ' + (isRej ? '#ef444450' : '#10b98135'),
                                borderRadius: '8px',
                                padding: '8px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                                  {item.label}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    background: isRej ? '#dc262630' : '#05966930',
                                    color: isRej ? '#f87171' : '#34d399',
                                    border: '1px solid ' + (isRej ? '#ef444450' : '#10b98150'),
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {isRej ? '✕ REJECTED' : '✓ VERIFIED'}
                                </span>
                              </div>
                              {isRej && item.remarks && (
                                <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px', wordBreak: 'break-word', fontStyle: 'italic' }}>
                                  Issue: "{item.remarks}"
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Condition Alert Banner */}
                    {rejectedCount > 0 ? (
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef444460', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
                        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>
                            Sanction Blocked: {rejectedCount} Document(s) Flagged for Rejection
                          </div>
                          <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>
                            Jab tak saare documents "Verified" nahi hote, State Administrative Sanction issue nahi ho sakta. Niche diye gaye button se rejection return karein.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b98150', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399' }}>
                        <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>
                            All Documents Verified (6/6 Passed)
                          </div>
                          <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '2px' }}>
                            Saare documents verify ho chuke hain. Aap ab Partner ko Sanction issue karke lead execute karne ke liye assign kar sakte hain.
                          </div>
                        </div>
                      </div>
                    )}

                    {showRejectForm ? (
                      <div style={{ marginTop: '12px', background: '#070b13', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                          Specify Rejection Reason (Visible to Agent, Distributor & Consumer):
                        </label>
                        <textarea
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Electricity bill CA number mismatch, blurred Aadhaar image, roof area insufficient..."
                          style={{ width: '100%', padding: '10px 12px', background: '#0d1527', border: '1px solid #475569', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                          {rejectedCount > 0 && (
                            <button
                              type="button"
                              disabled={auditSubmitting}
                              onClick={() => handleAdminRejectConsumer(false)}
                              style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >
                              {auditSubmitting ? 'Rejecting...' : `Reject Marked Sections (${rejectedCount})`}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={auditSubmitting}
                            onClick={() => handleAdminRejectConsumer(true)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                          >
                            {auditSubmitting ? 'Rejecting...' : 'Confirm Full Application Rejection'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {rejectedCount > 0 && (
                          <button
                            type="button"
                            disabled={auditSubmitting}
                            onClick={() => handleAdminRejectConsumer(false)}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '11px 20px',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            <XCircle size={15} /> Reject Marked Sections Only ({rejectedCount})
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowRejectForm(true)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <XCircle size={15} /> Full Rejection Options
                        </button>

                        {/* GATED SANCTION BUTTON */}
                        {isAllVerified ? (
                          <button
                            type="button"
                            disabled={auditSubmitting}
                            onClick={handleAdminApproveConsumer}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '11px 26px',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                            }}
                          >
                            <CheckCircle2 size={16} /> {auditSubmitting ? 'Approving...' : 'Approve & Sanction Partner'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={true}
                            style={{
                              background: '#1e293b',
                              color: '#64748b',
                              border: '1px solid rgba(255,255,255,0.08)',
                              padding: '11px 22px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: 0.65
                            }}
                            title={`Cannot issue sanction: ${rejectedCount} document(s) are rejected.`}
                          >
                            <Lock size={15} /> Sanction Locked ({rejectedCount} Rejected)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Legacy Assign Partner Modal */}
      {assignModalApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 700, color: '#fff' }}>
              Assign EPC Partner to {assignModalApp.fullName} ({assignModalApp.registrationId})
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Select Certified EPC Partner</label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                style={{ width: '100%', padding: '11px', background: '#070b13', border: '1px solid #334155', borderRadius: '9px', color: '#fff', fontSize: '13px' }}
              >
                {partners.map((p) => (
                  <option key={p._id} value={p._id}>{p.companyName || p.fullName} ({p.territory || 'Delhi NCR'})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setAssignModalApp(null)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAssignPartner} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Assign Partner</button>
            </div>
          </div>
        </div>
      )}

      {/* Distributor Full Details Popup Modal */}
      {viewDistributorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              maxWidth: '640px',
              width: '100%',
              padding: '28px 32px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                  }}
                >
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    Distributor Details
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Regional Agency Information & Lead Routing
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewDistributorModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Profile Highlight Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(13, 21, 39, 0.6) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '18px',
                  }}
                >
                  {viewDistributorModal.fullName?.[0] || 'D'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    {viewDistributorModal.fullName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                    {viewDistributorModal.companyName || 'Solar Agency'}
                  </div>
                </div>
              </div>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ● Active Distributor
              </span>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
              {/* Contact Info */}
              <div style={{ background: '#070b13', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Contact Information
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{viewDistributorModal.email}</div>
                  <div style={{ color: '#94a3b8', marginTop: '3px' }}>📱 {viewDistributorModal.mobile || '—'}</div>
                </div>
              </div>

              {/* Territory */}
              <div style={{ background: '#070b13', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Assigned Territory
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                  📍 {viewDistributorModal.territory || 'Delhi NCR'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Regional Jurisdiction
                </div>
              </div>

              {/* Assigned EPC Partner */}
              <div style={{ background: '#070b13', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Assigned EPC Partner
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                    {viewDistributorModal.assignedPartnerName || 'Not Assigned'}
                  </div>
                  <button
                    onClick={() => {
                      handleOpenAssignDistributorPartner(viewDistributorModal);
                      setViewDistributorModal(null);
                    }}
                    style={{
                      background: 'rgba(2, 132, 199, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Change
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Receives verified leads from this agency
                </div>
              </div>

              {/* Routing Mode */}
              <div style={{ background: '#070b13', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Routing Mode
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: viewDistributorModal.verificationMode === 'AUTO' ? '#34d399' : '#fbbf24',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: viewDistributorModal.verificationMode === 'AUTO' ? '#10b981' : '#f59e0b',
                      }}
                    />
                    {viewDistributorModal.verificationMode === 'AUTO' ? 'Auto' : 'Manual'}
                  </span>
                  <button
                    onClick={async () => {
                      await handleToggleDistributorMode(viewDistributorModal);
                      setViewDistributorModal((prev) => ({
                        ...prev,
                        verificationMode: prev.verificationMode === 'AUTO' ? 'MANUAL' : 'AUTO',
                      }));
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Switch to {viewDistributorModal.verificationMode === 'AUTO' ? 'Manual' : 'Auto'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  {viewDistributorModal.verificationMode === 'AUTO' ? 'Leads route directly to Partner' : 'Leads require State Admin review'}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => handleLoginAs(viewDistributorModal)}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ExternalLink size={14} /> Login as Distributor
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    handleOpenEdit(viewDistributorModal);
                    setViewDistributorModal(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setViewDistributorModal(null)}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
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
    </div>
  );
}
