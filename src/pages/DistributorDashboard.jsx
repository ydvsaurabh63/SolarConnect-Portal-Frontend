import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  FileText,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Lock,
  XCircle,
  Eye,
  Check,
  X,
  ArrowRight,
  Camera,
  Briefcase,
  LayoutDashboard,
  Search,
  LogOut,
  Globe,
  RefreshCw,
  Building2,
  Filter,
} from 'lucide-react';
import VerificationTrackerModal from '../components/VerificationTrackerModal';
import DocumentComparisonCards from '../components/DocumentComparisonCards';
import DashboardMobileNav from '../components/DashboardMobileNav';

export default function DistributorDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'agents' | 'leads' | 'profile'
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [docAudits, setDocAudits] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewTrackingApp, setViewTrackingApp] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [leadFilter, setLeadFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  useEffect(() => {
    if (selectedLead && selectedLead.documents) {
      const initial = {};
      const docs = selectedLead.documents;
      ['aadhaarCard', 'panCard', 'bijliBill', 'bankPassbook', 'jaminRasid', 'rooftopGpsPhoto'].forEach((k) => {
        initial[k] = {
          status: docs[k]?.status || 'Verified',
          remarks: docs[k]?.remarks || '',
        };
      });
      setDocAudits(initial);
    }
  }, [selectedLead]);

  const handleLogout = () => {
    logoutUser();
    navigate('/distributor/login');
  };

  // Add Agent Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    territory: 'Rohini Sector 15',
  });
  const [msg, setMsg] = useState('');

  // Edit Agent Modal
  const [editAgent, setEditAgent] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    territory: '',
  });
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsRes, appsRes] = await Promise.all([
        api.getUsers({ role: 'agent' }),
        api.getSubmissionLog(),
      ]);

      if (agentsRes.success) setAgents(agentsRes.users);
      if (appsRes.success) setLeads(appsRes.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.createUser({
        ...formData,
        password: formData.password || 'agent123',
        role: 'agent',
        createdById: currentUser?._id,
        createdByName: currentUser?.fullName,
        distributorId: currentUser?._id,
        distributorName: currentUser?.fullName,
        distributorCode: currentUser?.code || currentUser?.executiveId || 'DST-101-01',
        adminId: currentUser?.adminId || '',
        adminName: currentUser?.adminName || '',
        adminCode: currentUser?.adminCode || '',
      });

      if (res.success) {
        setShowAddModal(false);
        setFormData({ fullName: '', email: '', mobile: '', password: '', territory: '' });
        loadData();
      } else {
        setMsg('❌ ' + (res.message || 'Error creating agent'));
      }
    } catch (err) {
      setMsg('❌ Error creating agent');
    }
  };

  const handleOpenEdit = (ag) => {
    setEditAgent(ag);
    setEditForm({
      fullName: ag.fullName || '',
      email: ag.email || '',
      mobile: ag.mobile || '',
      password: '', // Never pre-fill password into form
      territory: ag.territory || '',
    });
    setEditMsg('');
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    if (!editAgent) return;
    setEditMsg('');
    try {
      const payload = { ...editForm };
      if (!payload.password || !payload.password.trim()) {
        delete payload.password; // Do not overwrite with empty password
      }
      const res = await api.updateUser(editAgent._id, payload);
      if (res.success) {
        setEditAgent(null);
        loadData();
      } else {
        setEditMsg('❌ ' + (res.message || 'Failed to update agent'));
      }
    } catch (err) {
      setEditMsg('❌ Error updating agent');
    }
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm('Are you sure you want to delete this Field Agent?')) {
      await api.deleteUser(id);
      loadData();
    }
  };

  // 1-Click Login As Agent in a New Tab
  const handleLoginAsAgent = (ag) => {
    const url = `${window.location.origin}/agent/dashboard?impersonate=${ag._id}&by=distributor`;
    window.open(url, '_blank');
  };

  // Multi-Tier Verification Handlers
  const handleVerifyLead = async (lead) => {
    setActionMsg('');
    setActionLoading(true);
    try {
      const targetId = lead.registrationId || lead._id;
      const res = await api.distributorVerify(targetId, {
        action: 'VERIFY',
        documentAudits: docAudits,
        verifiedBy: currentUser?.fullName || 'Distributor Desk',
      });
      if (res.success) {
        setActionMsg('✅ Application verified successfully! Forwarded to State Admin Desk.');
        await loadData();
        if (selectedLead && (selectedLead._id === lead._id || selectedLead.registrationId === lead.registrationId)) {
          setSelectedLead(res.record || { ...selectedLead, overallStatus: 'Distributor_Verified' });
        }
        setTimeout(() => {
          setSelectedLead(null);
        }, 1500);
      } else {
        setActionMsg('❌ ' + (res.message || 'Verification failed'));
      }
    } catch (err) {
      setActionMsg('❌ Verification error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLead = async (lead, isFullReject = false) => {
    let finalReason = rejectionReason.trim();
    const rejectedItems = Object.entries(docAudits)
      .filter(([_, val]) => val.status === 'Rejected')
      .map(([k, val]) => `${k.replace('Card', '').replace('Bill', ' Bill').replace('Passbook', ' Passbook').replace('Rasid', ' Deed')}: ${val.remarks || 'Needs re-upload'}`);

    if (!finalReason && rejectedItems.length > 0) {
      finalReason = 'Specific correction required in: ' + rejectedItems.join('; ');
    }
    if (!finalReason) {
      finalReason = isFullReject ? 'Entire application rejected by Distributor for full re-survey' : 'Selected documents require correction';
    }

    setActionMsg('');
    setActionLoading(true);
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

      const targetId = lead.registrationId || lead._id;
      const res = await api.distributorVerify(targetId, {
        action: 'REJECT',
        rejectionReason: finalReason,
        rejectionScope: isFullReject ? 'FULL' : 'PARTIAL',
        documentAudits: auditsToSend,
        verifiedBy: currentUser?.fullName || 'Distributor Desk',
      });
      if (res.success) {
        setActionMsg(isFullReject 
          ? '❌ Full Application Rejected. Entire survey requires re-submission.' 
          : '⚠️ Specific sections rejected. Returned to Agent & Consumer for re-upload.');
        setShowRejectInput(false);
        setRejectionReason('');
        await loadData();
        if (selectedLead && (selectedLead._id === lead._id || selectedLead.registrationId === lead.registrationId)) {
          setSelectedLead(res.record || { ...selectedLead, overallStatus: 'Rejected_By_Distributor' });
        }
        setTimeout(() => {
          setSelectedLead(null);
        }, 1800);
      } else {
        setActionMsg('❌ ' + (res.message || 'Rejection failed'));
      }
    } catch (err) {
      setActionMsg('❌ Rejection error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Search filtered items
  const filteredAgents = useMemo(() => {
    return agents.filter((ag) =>
      ag.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.territory?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [agents, searchQuery]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((l) => {
        const s = l.overallStatus || (l.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
        if (leadFilter === 'PENDING') return s === 'Pending_Distributor';
        if (leadFilter === 'VERIFIED') return ['Distributor_Verified', 'Assigned_To_Partner', 'Feasibility_Approved'].includes(s);
        if (leadFilter === 'REJECTED') return ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(s) || l.verification?.status === 'Rejected';
        return true;
      })
      .filter((l) =>
        l.registrationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.consumerNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.agentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.districtCity?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [leads, leadFilter, searchQuery]);

  const pendingLeadsCount = leads.filter((l) => (l.overallStatus || 'Pending_Distributor') === 'Pending_Distributor').length;
  const verifiedLeadsCount = leads.filter((l) => ['Distributor_Verified', 'Assigned_To_Partner', 'Feasibility_Approved', 'Done'].includes(l.overallStatus || l.verification?.status)).length;
  const rejectedLeadsCount = leads.filter((l) => ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(l.overallStatus) || l.verification?.status === 'Rejected').length;

  const renderMobileConsumerCard = (l) => {
    const status = l.overallStatus || (l.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
    const isPendingDist = status === 'Pending_Distributor';
    const isDistVerified = status === 'Distributor_Verified';
    const isPartnerAssigned = ['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(status);
    const isDistRejected = status === 'Rejected_By_Distributor';
    const isAdminRejected = status === 'Rejected_By_Admin';

    let badgeColor = '#f59e0b';
    let badgeBg = 'rgba(245, 158, 11, 0.15)';
    let badgeBorder = 'rgba(245, 158, 11, 0.3)';
    let statusLabel = 'Pending Audit';

    if (isDistRejected) {
      badgeColor = '#f87171';
      badgeBg = 'rgba(239, 68, 68, 0.15)';
      badgeBorder = 'rgba(239, 68, 68, 0.3)';
      statusLabel = 'Rejected (Distributor)';
    } else if (isAdminRejected) {
      badgeColor = '#fb923c';
      badgeBg = 'rgba(234, 88, 12, 0.15)';
      badgeBorder = 'rgba(234, 88, 12, 0.3)';
      statusLabel = 'Rejected (Admin)';
    } else if (isPartnerAssigned) {
      badgeColor = '#34d399';
      badgeBg = 'rgba(16, 185, 129, 0.15)';
      badgeBorder = 'rgba(16, 185, 129, 0.3)';
      statusLabel = 'Assigned to Partner';
    } else if (isDistVerified) {
      badgeColor = '#38bdf8';
      badgeBg = 'rgba(56, 189, 248, 0.15)';
      badgeBorder = 'rgba(56, 189, 248, 0.3)';
      statusLabel = 'Distributor Verified';
    }

    return (
      <div key={l._id} className="mobile-app-card">
        <div className="mac-top">
          <div className="mac-name-group">
            <span className="mac-name" onClick={() => { setSelectedLead(l); setShowRejectInput(false); setRejectionReason(''); setActionMsg(''); }}>{l.fullName}</span>
            <span className="mac-reg">{l.registrationId}</span>
          </div>
          <span className="mac-status-badge" style={{ color: badgeColor, background: badgeBg, borderColor: badgeBorder }}>
            {isDistRejected || isAdminRejected ? <XCircle size={11} /> : isDistVerified || isPartnerAssigned ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {statusLabel}
          </span>
        </div>

        <div className="mac-meta-row">
          <div className="mac-meta-item">
            <span className="mac-meta-label">Consumer CA</span>
            <span className="mac-meta-val">{l.consumerNo}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Mobile</span>
            <span className="mac-meta-val">{l.mobile}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Field Agent</span>
            <span className="mac-meta-val">{l.agentName || 'Assigned Agent'}</span>
          </div>
        </div>

        <div className="mac-actions">
          <button 
            type="button" 
            className="mac-action-btn view"
            onClick={() => {
              setSelectedLead(l);
              setShowRejectInput(false);
              setRejectionReason('');
              setActionMsg('');
            }}
            style={{
              background: isPendingDist ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'rgba(56, 189, 248, 0.12)',
              color: '#fff',
              border: isPendingDist ? 'none' : '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            <Eye size={13} /> {isPendingDist ? 'Review & Verify' : 'View Audit'}
          </button>
        </div>
      </div>
    );
  };

  const renderMobileAgentCard = (ag) => {
    return (
      <div key={ag._id} className="mobile-app-card">
        <div className="mac-top">
          <div className="mac-name-group">
            <span className="mac-name">{ag.fullName}</span>
            <span className="mac-reg">{ag.code || ag.executiveId || 'AGT-CODE'}</span>
          </div>
          <span className="mac-status-badge" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            Active Agent
          </span>
        </div>

        <div className="mac-meta-row">
          <div className="mac-meta-item">
            <span className="mac-meta-label">Mobile</span>
            <span className="mac-meta-val">{ag.mobile}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Territory</span>
            <span className="mac-meta-val">{ag.territory || 'Assigned Ward'}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Surveys</span>
            <span className="mac-meta-val">{ag.submissionsCount || 0}</span>
          </div>
        </div>

        <div className="mac-actions">
          <button 
            type="button" 
            className="mac-action-btn view"
            onClick={() => handleImpersonateAgent(ag)}
            style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
          >
            <ExternalLink size={13} /> Login
          </button>
          <button 
            type="button" 
            className="mac-action-btn view"
            onClick={() => handleOpenEdit(ag)}
          >
            <Edit2 size={13} /> Edit
          </button>
          <button 
            type="button" 
            className="mac-action-btn"
            onClick={() => handleDeleteAgent(ag._id)}
            style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', flex: '0 0 38px' }}
          >
            <Trash2 size={13} />
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
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
              }}
            >
              <Briefcase size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                SolarConnect
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Distributor
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(30, 41, 59, 0.6) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
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
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {currentUser?.fullName?.[0] || 'D'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || 'Distributor'}
              </div>
              <div style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                {currentUser?.territory || 'Online'}
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
                background: activeTab === 'overview' ? 'linear-gradient(90deg, #d97706 0%, #b45309 100%)' : 'transparent',
                color: activeTab === 'overview' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={17} color={activeTab === 'overview' ? '#fff' : '#f59e0b'} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'agents' ? 'linear-gradient(90deg, #d97706 0%, #b45309 100%)' : 'transparent',
                color: activeTab === 'agents' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={17} color={activeTab === 'agents' ? '#fff' : '#10b981'} />
                <span>Agent</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {agents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'leads' ? 'linear-gradient(90deg, #d97706 0%, #b45309 100%)' : 'transparent',
                color: activeTab === 'leads' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={17} color={activeTab === 'leads' ? '#fff' : '#38bdf8'} />
                <span>Consumer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {pendingLeadsCount > 0 && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                )}
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  {leads.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'profile' ? 'linear-gradient(90deg, #d97706 0%, #b45309 100%)' : 'transparent',
                color: activeTab === 'profile' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={17} color={activeTab === 'profile' ? '#fff' : '#a855f7'} />
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
          role="Distributor"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          tabs={[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'leads', label: 'Surveys', icon: FileText, badge: pendingLeadsCount },
            { id: 'agents', label: 'Agents', icon: Users, badge: agents.length },
            { id: 'profile', label: 'Profile', icon: Building2 },
          ]}
        />
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
            <span>👁️ <strong>IMPERSONATION SESSION:</strong> Logged in as Distributor <strong>{currentUser.fullName}</strong>, delegated by {currentUser.impersonatedBy?.toUpperCase() || 'ADMIN'}.</span>
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
            <span style={{ color: '#cbd5e1' }}>Distributor</span>
            <span>/</span>
            <span style={{ color: '#f59e0b', fontWeight: 600, textTransform: 'capitalize' }}>
              {activeTab === 'leads' ? 'Consumer' : activeTab}
            </span>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search consumers, agents, phone..."
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

            {activeTab === 'agents' && (
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Plus size={16} /> + Add Agent
              </button>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              Online • Synced
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="dashboard-main-content" style={{ padding: '28px', maxWidth: '1400px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          {/* 4 Rich KPI Metric Cards */}
          <div className="dashboard-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div
              className="kpi-metric-card"
              onClick={() => setActiveTab('agents')}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Active Field Agents</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '12px' }}>{agents.length}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Field survey team roster</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('leads'); setLeadFilter('ALL'); }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Total Consumers</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', marginTop: '12px' }}>{leads.length}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Registered customer accounts</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('leads'); setLeadFilter('PENDING'); }}
              style={{
                background: pendingLeadsCount > 0 ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid ' + (pendingLeadsCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>Pending Verification</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '12px' }}>{pendingLeadsCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px' }}>Requires distributor document audit</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('leads'); setLeadFilter('VERIFIED'); }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Verified & Forwarded</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '12px' }}>{verifiedLeadsCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Sent to Admin / Partner Desk</div>
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
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>Create new field agents or directly audit submitted customer survey booklets.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowAddModal(true)}
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
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Plus size={16} /> + Add Field Agent
                  </button>
                  <button
                    onClick={() => { setActiveTab('leads'); setLeadFilter('PENDING'); }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
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
                    <Clock size={16} /> Audit Pending Leads ({pendingLeadsCount})
                  </button>
                </div>
              </div>

              {/* Verification Queue Section */}
              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={19} color="#f59e0b" /> Document Verification Desk
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Review 10-point ground survey booklet data submitted by field agents before admin approval.
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('leads'); setLeadFilter('PENDING'); }}
                    style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All Leads ({leads.length})
                  </button>
                </div>

                {leads.filter((l) => (l.overallStatus || 'Pending_Distributor') === 'Pending_Distributor').length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                    <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>Verification Queue is Clear!</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>All submitted field applications have been audited and processed.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leads
                      .filter((l) => (l.overallStatus || 'Pending_Distributor') === 'Pending_Distributor')
                      .slice(0, 4)
                      .map((lead) => (
                        <div
                          key={lead._id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '14px' }}>{lead.registrationId}</span>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 700 }}>Action Required</span>
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{lead.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              CA: <strong>{lead.consumerNo}</strong> | 📞 {lead.mobile} | Agent: {lead.agentName || 'Field Agent'}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowRejectInput(false);
                              setRejectionReason('');
                              setActionMsg('');
                            }}
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
                              gap: '6px',
                            }}
                          >
                            <Eye size={16} /> Audit 10-Docs & Verify
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Quick Field Agents Roster */}
              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={19} color="#10b981" /> Active Field Agents Team
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Ground agents assigned to your distributor franchise.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Agent
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>Agent Name</th>
                        <th style={{ padding: '12px 16px' }}>Contact</th>
                        <th style={{ padding: '12px 16px' }}>Territory / Ward</th>
                        <th style={{ padding: '12px 16px' }}>1-Click Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.slice(0, 5).map((ag) => (
                        <tr key={ag._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#05966925', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                {ag.fullName?.[0] || 'A'}
                              </div>
                              <div>{ag.fullName}</div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{ag.email}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#10b98120', color: '#34d399', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                              {ag.territory || 'Assigned Area'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              onClick={() => handleLoginAsAgent(ag)}
                              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <ExternalLink size={13} /> Open Desk
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGENTS */}
          {activeTab === 'agents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>My Field Agents ({filteredAgents.length})</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Create and manage field executives responsible for conducting consumer rooftop surveys.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
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
                  <Plus size={18} /> + Add Field Agent
                </button>
              </div>

              <div className="desktop-only-table" style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '16px 20px' }}>Agent Name</th>
                      <th style={{ padding: '16px 20px' }}>Email & Mobile</th>
                      <th style={{ padding: '16px 20px' }}>Assigned Ward / Sector</th>
                      <th style={{ padding: '16px 20px' }}>1-Click Login (New Tab)</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((ag) => (
                      <tr key={ag._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#05966920', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {ag.fullName?.[0] || 'A'}
                            </div>
                            <div>
                              <div style={{ color: '#fff' }}>{ag.fullName}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>Field Representative</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#cbd5e1' }}>{ag.email}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ag.mobile || '—'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: '#10b98120', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                            {ag.territory || 'Assigned Area'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <button
                            onClick={() => handleLoginAsAgent(ag)}
                            style={{
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ExternalLink size={14} /> Login
                          </button>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEdit(ag)}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAgent(ag._id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAgents.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No field agents found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Agents */}
              <div className="mobile-only-card-list">
                {filteredAgents.map((ag) => renderMobileAgentCard(ag))}
                {filteredAgents.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    No field agents found matching your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONSUMERS & VERIFICATION */}
          {activeTab === 'leads' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>Consumer Verification Desk</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Audit digital application booklets and verify consumer documents before administrative approval.</p>
                </div>
              </div>

              {/* Filter Tabs for Consumers */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {[
                  { key: 'ALL', label: `All Consumers (${leads.length})` },
                  {
                    key: 'PENDING',
                    label: `Pending Verification (${pendingLeadsCount})`,
                    color: '#f59e0b',
                  },
                  {
                    key: 'VERIFIED',
                    label: `Verified / Forwarded (${verifiedLeadsCount})`,
                    color: '#38bdf8',
                  },
                  {
                    key: 'REJECTED',
                    label: `Rejected Consumers (${rejectedLeadsCount})`,
                    color: '#ef4444',
                  },
                ].map((f) => {
                  const isActive = leadFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setLeadFilter(f.key)}
                      style={{
                        background: isActive ? (f.color || '#d97706') : '#1e293b',
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
                      <th style={{ padding: '16px 20px' }}>Consumer Name & CA</th>
                      <th style={{ padding: '16px 20px' }}>Reg ID & Date</th>
                      <th style={{ padding: '16px 20px' }}>Field Agent</th>
                      <th style={{ padding: '16px 20px' }}>10-Point Survey Documents</th>
                      <th style={{ padding: '16px 20px' }}>Verification Status</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l) => {
                      const status = l.overallStatus || (l.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
                      const isPendingDist = status === 'Pending_Distributor';
                      const isDistVerified = status === 'Distributor_Verified';
                      const isPartnerAssigned = ['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(status);
                      const isDistRejected = status === 'Rejected_By_Distributor';
                      const isAdminRejected = status === 'Rejected_By_Admin';

                      return (
                        <tr key={l._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div
                              onClick={() => {
                                setSelectedLead(l);
                                setShowRejectInput(false);
                                setRejectionReason('');
                                setActionMsg('');
                              }}
                              style={{
                                fontWeight: 700,
                                color: '#38bdf8',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                                fontSize: '15px',
                              }}
                              title="Click to view full consumer details & documents"
                            >
                              {l.fullName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                              📞 {l.mobile} {l.alternateNo ? `| Alt: ${l.alternateNo}` : ''}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              CA: <strong>{l.consumerNo}</strong> | {l.districtCity}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, color: '#f59e0b' }}>{l.registrationId}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {l.issuedOn ? new Date(l.issuedOn).toLocaleDateString() : 'Today'}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#94a3b8' }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{l.agentName || l.executiveName || 'Field Agent'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{l.agentCode || 'AGT-FIELD'}</div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '280px' }}>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: l.documents?.aadhaarCard?.collected ? '#065f4625' : '#ef444420', color: l.documents?.aadhaarCard?.collected ? '#34d399' : '#f87171' }}>
                                Aadhaar {l.aadhaarNumber ? `(${l.aadhaarNumber.slice(-4)})` : ''}
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: l.documents?.panCard?.collected ? '#065f4625' : '#ef444420', color: l.documents?.panCard?.collected ? '#34d399' : '#f87171' }}>
                                PAN {l.panNumber ? `(${l.panNumber.slice(-4)})` : ''}
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: l.documents?.bijliBill?.collected ? '#065f4625' : '#ef444420', color: l.documents?.bijliBill?.collected ? '#34d399' : '#f87171' }}>
                                Bijli Bill
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: l.documents?.bankPassbook?.collected ? '#065f4625' : '#ef444420', color: l.documents?.bankPassbook?.collected ? '#34d399' : '#f87171' }}>
                                Bank Passbook
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: l.documents?.jaminRasid?.collected ? '#065f4625' : '#ef444420', color: l.documents?.jaminRasid?.collected ? '#34d399' : '#f87171' }}>
                                Jamin Rasid
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: l.documents?.rooftopGpsPhoto?.collected ? '#065f4625' : '#ef444420', color: l.documents?.rooftopGpsPhoto?.collected ? '#34d399' : '#f87171' }}>
                                GPS Rooftop
                              </span>
                            </div>
                          </td>
                          <td 
                            style={{ padding: '16px 20px', cursor: 'pointer' }}
                            onClick={() => setViewTrackingApp(l)}
                            title="Click to track complete verification lifecycle"
                          >
                            {isPendingDist && (
                              <span style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <Clock size={12} /> Pending Verification
                              </span>
                            )}
                            {isDistVerified && (
                              <span style={{ background: '#0284c720', color: '#38bdf8', border: '1px solid #0284c740', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <CheckCircle2 size={12} /> Distributor Verified (Pending Admin)
                              </span>
                            )}
                            {isPartnerAssigned && (
                              <span style={{ background: '#10b98120', color: '#34d399', border: '1px solid #10b98140', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <ShieldCheck size={12} /> Assigned to Partner
                              </span>
                            )}
                            {isDistRejected && (
                              <div>
                                <span style={{ background: '#ef444420', color: '#f87171', border: '1px solid #ef444440', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                  <XCircle size={12} /> Rejected by You
                                </span>
                                {l.distributorVerification?.rejectionReason && (
                                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', maxWidth: '200px' }}>
                                    "{l.distributorVerification.rejectionReason}"
                                  </div>
                                )}
                              </div>
                            )}
                            {isAdminRejected && (
                              <div>
                                <span style={{ background: '#ea580c20', color: '#fb923c', border: '1px solid #ea580c40', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                  <XCircle size={12} /> Rejected by Admin
                                </span>
                                {l.adminVerification?.rejectionReason && (
                                  <div style={{ fontSize: '11px', color: '#fb923c', marginTop: '4px', maxWidth: '200px' }}>
                                    "{l.adminVerification.rejectionReason}"
                                  </div>
                                )}
                              </div>
                            )}
                            {status === 'Admin_Approved' && (
                              <span style={{ background: '#10b98120', color: '#34d399', border: '1px solid #10b98140', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <CheckCircle2 size={12} /> Approved by Admin
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setSelectedLead(l);
                                setShowRejectInput(false);
                                setRejectionReason('');
                                setActionMsg('');
                              }}
                              style={{
                                background: isPendingDist ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : '#334155',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Eye size={14} /> {isPendingDist ? 'Review & Verify' : 'View Audit'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No customer leads found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Consumers */}
              <div className="mobile-only-card-list">
                {filteredLeads.map((l) => renderMobileConsumerCard(l))}
                {filteredLeads.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    No customer leads found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#fff' }}>Distributor Franchise Profile</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Franchise Name / Partner</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{currentUser?.fullName || 'Distributor'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Franchise Code</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>{currentUser?.code || currentUser?.executiveId || 'DST-101-01'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Allocated Territory / Ward</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{currentUser?.territory || 'Delhi NCR'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Assigned State Admin</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{currentUser?.adminName || 'State Admin Central'}</div>
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

      {/* Modal: Add Agent */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Register New Field Agent</h3>

            <form onSubmit={handleCreateAgent}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Agent Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rakesh"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Agent Login Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. ramesh.agent@solar.com"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Mobile Number</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="e.g. 9876500004"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Assigned Ward / Sector</label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  placeholder="e.g. Rohini Sector 15 / Model Town"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {msg && <div style={{ marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Agent & Password */}
      {editAgent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Edit Agent: {editAgent.fullName}</h3>

            <form onSubmit={handleUpdateAgent}>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Email Address</label>
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

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Assigned Ward / Sector</label>
                <input
                  type="text"
                  value={editForm.territory}
                  onChange={(e) => setEditForm({ ...editForm, territory: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '6px' }}>
                  🔑 Change Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep existing password"
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #f59e0b50', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {editMsg && <div style={{ marginBottom: '14px', fontSize: '13px' }}>{editMsg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditAgent(null)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review & Verify Lead */}
      {selectedLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
                  <ShieldCheck size={16} /> Distributor Verification & Document Audit
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 2px', color: '#f8fafc' }}>
                  {selectedLead.fullName} — {selectedLead.registrationId}
                </h2>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Consumer No: <strong style={{ color: '#fff' }}>{selectedLead.consumerNo}</strong> | Registered by Agent: <strong style={{ color: '#38bdf8' }}>{selectedLead.agentName || selectedLead.executiveName || 'Agent'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Notification message */}
            {actionMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', background: actionMsg.startsWith('✅') ? '#065f4630' : '#ef444425', border: '1px solid ' + (actionMsg.startsWith('✅') ? '#05966950' : '#ef444450'), color: actionMsg.startsWith('✅') ? '#34d399' : '#f87171', fontSize: '14px', fontWeight: 600 }}>
                {actionMsg}
              </div>
            )}

            {/* Section 1: Customer & Site Overview */}
            <div style={{ background: '#0f172a', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', margin: '0 0 12px', fontWeight: 700 }}>
                Consumer & Rooftop Survey Particulars
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Mobile Phone</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedLead.mobile}</strong>
                  {selectedLead.alternateNo && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Alt: {selectedLead.alternateNo}</div>}
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Email Address</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedLead.email || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Average Electricity Bill</span>
                  <strong style={{ color: '#f59e0b' }}>₹{selectedLead.avgMonthlyBill?.toLocaleString('en-IN')} / month</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Rooftop Usable Area</span>
                  <strong style={{ color: '#10b981' }}>{selectedLead.rooftopArea || 0} Sq. Ft ({selectedLead.roofType || 'RCC'})</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Installation Site Address</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedLead.propertyAddress || selectedLead.address}</strong>
                </div>
              </div>
            </div>

            {/* Section 2: 10-Point Mandatory Document & Survey Checklist with Side-by-Side Verification */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.5px', margin: '0 0 14px', fontWeight: 700 }}>
                Mandatory Documents: Number & Photo Side-by-Side Audit
              </h4>
              <DocumentComparisonCards 
                application={selectedLead} 
                isReviewer={true} 
                documentAudits={docAudits}
                onAuditChange={(docKey, auditVal, all) => setDocAudits(all)}
              />
            </div>

            {/* Section 3: Verification & Decision Controls */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '18px' }}>
              {selectedLead.overallStatus === 'Pending_Distributor' ? (
                <div>
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
                        {/* Live Document Audit Status Summary Checklist */}
                        <div style={{ marginBottom: '16px', background: '#070b13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#cbd5e1' }}>
                              Document Audit Summary ({verifiedDocs.length}/{entries.length} Verified)
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

                        {/* Condition Banner */}
                        {rejectedCount > 0 ? (
                          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef444460', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
                            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800 }}>
                                Verification Blocked: {rejectedCount} Document(s) Flagged for Rejection
                              </div>
                              <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>
                                Jab tak saare documents "Verified" nahi hote, ye application aage Admin Desk par nahi ja sakti. Niche diye gaye button se rejection return karein taaki Agent aur Consumer sirf inhi documents ko re-upload kar sakein.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b98150', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399' }}>
                            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800 }}>
                                All 6 Documents Verified & Accepted (6/6 Passed)
                              </div>
                              <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '2px' }}>
                                Saare mandatory documents verify ho chuke hain. Aap ab application ko State Administrative Sanction ke liye aage forward kar sakte hain.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Inline Action Message above action buttons */}
                        {actionMsg && (
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '16px',
                            background: actionMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid ' + (actionMsg.startsWith('✅') ? '#10b981' : '#ef4444'),
                            color: actionMsg.startsWith('✅') ? '#34d399' : '#f87171',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {actionMsg.startsWith('✅') ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span>{actionMsg}</span>
                          </div>
                        )}

                        {!showRejectInput ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>Distributor Verification Action</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {rejectedCount > 0 
                                  ? 'Aap rejected sections ko return kar sakte hain ya pure application ko reject kar sakte hain.'
                                  : 'Sabhi documents verify ho chuke hain, application ko aage forward karein.'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {rejectedCount > 0 ? (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleRejectLead(selectedLead, false)}
                                  style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '11px 20px',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: actionLoading ? 'wait' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                                    opacity: actionLoading ? 0.75 : 1
                                  }}
                                  title="Return application so Agent & Consumer can re-upload rejected documents"
                                >
                                  <XCircle size={16} /> {actionLoading ? 'Returning...' : `Return Application for Correction (${rejectedCount} Sections)`}
                                </button>
                              ) : null}

                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => setShowRejectInput(true)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  color: '#fca5a5',
                                  border: '1px dashed rgba(239, 68, 68, 0.4)',
                                  padding: '10px 16px',
                                  borderRadius: '10px',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                                title="Reject entire application requiring complete re-survey"
                              >
                                ⚠️ Full Form Rejection
                              </button>

                              {/* GATED FORWARD BUTTON: Disabled when rejectedCount > 0 */}
                              {isAllVerified ? (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleVerifyLead(selectedLead)}
                                  style={{
                                    background: actionLoading ? '#047857' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '11px 24px',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: actionLoading ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                                    opacity: actionLoading ? 0.75 : 1
                                  }}
                                >
                                  <Check size={16} /> {actionLoading ? 'Verifying & Forwarding...' : 'All Verified: Approve & Forward to Admin'}
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
                                  title={`Cannot forward: ${rejectedCount} document(s) are rejected. All documents must be verified first.`}
                                >
                                  <Lock size={15} /> Forward Locked ({rejectedCount} Rejected)
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '14px', marginBottom: '8px' }}>
                              Specify Full Rejection Note (Will be dispatched to Agent & Consumer):
                            </div>
                            <textarea
                              rows={2}
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="e.g. Ineligible site; completely fraudulent documents; full re-survey required..."
                              style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #ef444450', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', marginBottom: '12px' }}
                            ></textarea>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setShowRejectInput(false)}
                                style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                              >
                                Cancel
                              </button>
                              {rejectedCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleRejectLead(selectedLead, false)}
                                  style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
                                >
                                  Reject Marked Sections Only ({rejectedCount})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRejectLead(selectedLead, true)}
                                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
                              >
                                Confirm Full Form Rejection
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Current Stage:</span>{' '}
                    <strong style={{ color: selectedLead.overallStatus?.includes('Rejected') ? '#f87171' : '#34d399' }}>
                      {selectedLead.overallStatus}
                    </strong>
                    {selectedLead.distributorVerification?.rejectionReason && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        Rejection reason: "{selectedLead.distributorVerification.rejectionReason}"
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                  >
                    Close Audit
                  </button>
                </div>
              )}
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
