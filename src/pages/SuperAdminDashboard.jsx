import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  Users,
  Building,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Key,
  LayoutDashboard,
  Layers,
  LogOut,
  Sun,
  Eye,
  EyeOff,
  Copy,
  Check,
  Activity,
  Server,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Banknote,
  Wrench,
  UserCheck,
  ChevronRight,
  Filter,
  XCircle,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Navigation Sections: 'overview' | 'admins' | 'distributors' | 'partners' | 'financers' | 'agents' | 'installers' | 'consumers' | 'applications'
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Data states
  const [stats, setStats] = useState({ total: 0, pending: 0, done: 0 });
  const [allUsersList, setAllUsersList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // System Settings: Verification Mode & Routing
  const [systemSettings, setSystemSettings] = useState({
    verificationMode: 'MANUAL',
    distributorPartnerMapping: {},
  });
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingDistributorId, setMappingDistributorId] = useState('');
  const [mappingPartnerId, setMappingPartnerId] = useState('');
  const [mappingFinancerId, setMappingFinancerId] = useState('');
  const [mappingMsg, setMappingMsg] = useState('');

  // Admin Verification & Sanction Modal
  const [adminAuditLead, setAdminAuditLead] = useState(null);
  const [selectedEpcPartnerId, setSelectedEpcPartnerId] = useState('');
  const [selectedFinancerId, setSelectedFinancerId] = useState('');
  const [showAdminRejectInput, setShowAdminRejectInput] = useState(false);
  const [adminRejectReason, setAdminRejectReason] = useState('');
  const [auditMsg, setAuditMsg] = useState('');
  const [appFilter, setAppFilter] = useState('ALL');

  // Dynamic Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [createRole, setCreateRole] = useState('admin');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: 'solar@123',
    companyName: '',
    territory: '',
    consumerNo: '',
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
    consumerNo: '',
  });
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, allUsersRes, settingsRes] = await Promise.all([
        api.getStats(),
        api.getSubmissionLog(),
        api.getUsers(),
        api.getSettings(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (appsRes.success) setApplications(appsRes.records || []);
      if (allUsersRes.success) setAllUsersList(allUsersRes.users || []);
      if (settingsRes?.success) setSystemSettings(settingsRes.settings);
    } catch (err) {
      console.error('Error loading super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Auto / Manual Verification Mode
  const handleToggleVerificationMode = async () => {
    const nextMode = systemSettings.verificationMode === 'AUTO' ? 'MANUAL' : 'AUTO';
    try {
      const res = await api.updateSettings({ verificationMode: nextMode });
      if (res.success) {
        setSystemSettings(res.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Distributor-to-Partner Mapping
  const handleSaveDistributorMapping = async (e) => {
    e.preventDefault();
    if (!mappingDistributorId) return;
    const selectedDistributor = distributorsList.find((d) => d._id === mappingDistributorId);
    const selectedPartner = partnersList.find((p) => p._id === mappingPartnerId);
    const selectedFinancer = financersList.find((f) => f._id === mappingFinancerId);

    const updatePayload = {
      distributorPartnerMapping: {
        [mappingDistributorId]: {
          distributorName: selectedDistributor?.fullName || '',
          partnerId: selectedPartner?._id || '',
          partnerName: selectedPartner?.fullName || selectedPartner?.companyName || 'Solarize',
          partnerCode: selectedPartner?.code || 'PRT-101-01',
          financerId: selectedFinancer?._id || '',
          financerName: selectedFinancer?.fullName || selectedFinancer?.companyName || 'SBI',
          financerCode: selectedFinancer?.code || 'FIN-101-01',
        },
      },
    };

    try {
      const res = await api.updateSettings(updatePayload);
      if (res.success) {
        setSystemSettings(res.settings);
        setMappingMsg('✅ Mapping saved successfully!');
        setTimeout(() => {
          setShowMappingModal(false);
          setMappingMsg('');
        }, 1200);
      }
    } catch (err) {
      setMappingMsg('❌ Error saving mapping');
    }
  };

  // Admin Verification Handlers
  const handleAdminApproveLead = async (lead) => {
    setAuditMsg('');
    const partner = partnersList.find((p) => p._id === selectedEpcPartnerId) || partnersList[0];
    const financer = financersList.find((f) => f._id === selectedFinancerId) || financersList[0];

    try {
      const res = await api.adminVerify(lead._id, {
        action: 'APPROVE',
        partnerId: partner?._id || 'seed_partner_01',
        partnerName: partner?.fullName || partner?.companyName || 'Solarize',
        financerId: financer?._id || 'seed_financer_01',
        financerName: financer?.fullName || financer?.companyName || 'SBI',
        verifiedBy: currentUser?.fullName || 'GetSolarConnect',
      });

      if (res.success) {
        setAuditMsg('✅ Application sanctioned! Dispatched to EPC Partner & Financer.');
        await loadData();
        setTimeout(() => setAdminAuditLead(null), 1200);
      } else {
        setAuditMsg('❌ ' + (res.message || 'Approval failed'));
      }
    } catch (err) {
      setAuditMsg('❌ Error approving application: ' + err.message);
    }
  };

  const handleAdminRejectLead = async (lead) => {
    if (!adminRejectReason.trim()) {
      setAuditMsg('⚠️ Please enter a clear rejection reason.');
      return;
    }
    setAuditMsg('');
    try {
      const res = await api.adminVerify(lead._id, {
        action: 'REJECT',
        rejectionReason: adminRejectReason.trim(),
        verifiedBy: currentUser?.fullName || 'Super Admin HQ',
      });

      if (res.success) {
        setAuditMsg('❌ Application rejected. Rejection recorded across all dashboards.');
        setShowAdminRejectInput(false);
        setAdminRejectReason('');
        await loadData();
        setTimeout(() => setAdminAuditLead(null), 1200);
      } else {
        setAuditMsg('❌ ' + (res.message || 'Rejection failed'));
      }
    } catch (err) {
      setAuditMsg('❌ Error rejecting application: ' + err.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/superadmin/login');
  };

  const togglePasswordReveal = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Grouped Users by Specific Roles
  const adminsList = useMemo(() => allUsersList.filter((u) => u.role === 'admin'), [allUsersList]);
  const distributorsList = useMemo(() => allUsersList.filter((u) => u.role === 'distributor'), [allUsersList]);
  const partnersList = useMemo(() => allUsersList.filter((u) => u.role === 'partner'), [allUsersList]);
  const financersList = useMemo(() => allUsersList.filter((u) => u.role === 'financer'), [allUsersList]);
  const agentsList = useMemo(() => allUsersList.filter((u) => u.role === 'agent' || u.role === 'executive'), [allUsersList]);
  const installersList = useMemo(() => allUsersList.filter((u) => u.role === 'installer'), [allUsersList]);
  const consumersList = useMemo(() => allUsersList.filter((u) => u.role === 'user'), [allUsersList]);

  // Filter helper for searches
  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.fullName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.mobile?.includes(q) ||
        item.companyName?.toLowerCase().includes(q) ||
        item.territory?.toLowerCase().includes(q) ||
        item.consumerNo?.toLowerCase().includes(q) ||
        item.executiveId?.toLowerCase().includes(q)
    );
  };

  // Open Add Modal preconfigured for active section
  const handleOpenAddForSection = (role) => {
    setCreateRole(role);
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      password: role === 'admin' ? 'admin123' : 'solar@123',
      companyName:
        role === 'admin'
          ? 'State Operations Hub'
          : role === 'distributor'
          ? 'Solar Distribution Hub'
          : role === 'partner'
          ? 'Apex EPC Solutions'
          : role === 'financer'
          ? 'Renewable Energy Finance Bank'
          : role === 'installer'
          ? 'SunVolt Electricals'
          : '',
      territory: 'Delhi NCR',
      consumerNo: role === 'user' ? `CA-101-01-01-${String(consumersList.length + 1).padStart(3, '0')}` : '',
      adminId: adminsList[0]?._id || '',
      distributorId: distributorsList[0]?._id || '',
      agentId: agentsList[0]?._id || '',
      partnerId: partnersList[0]?._id || '',
    });
    setCreateMsg('');
    setShowAddModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      const res = await api.createUser({
        ...formData,
        role: createRole,
        createdById: currentUser?._id,
        createdByName: currentUser?.fullName || 'Super Admin HQ',
      });

      if (res.success) {
        setShowAddModal(false);
        loadData();
      } else {
        setCreateMsg('❌ ' + (res.message || 'Failed to create user'));
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
      password: user.password || '',
      territory: user.territory || '',
      companyName: user.companyName || '',
      consumerNo: user.consumerNo || '',
    });
    setEditMsg('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditMsg('');
    try {
      const res = await api.updateUser(editUser._id, editForm);
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

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await api.deleteUser(id);
      loadData();
    }
  };

  // 1-Click Login As in a New Tab
  const handleLoginAs = (user) => {
    const role = user.role === 'user' ? 'user' : user.role;
    const url = `${window.location.origin}/${role}/dashboard?impersonate=${user._id}&by=superadmin`;
    window.open(url, '_blank');
  };

  // Role metadata configurations for UI headers and colors
  const roleConfig = {
    admins: {
      title: 'Admin',
      singular: 'Admin',
      roleKey: 'admin',
      desc: 'All Admin users list and details.',
      badge: 'Admin',
      color: '#0284c7',
      bgGlow: 'rgba(2, 132, 199, 0.15)',
      list: filterList(adminsList),
      icon: Building,
    },
    distributors: {
      title: 'Distributor',
      singular: 'Distributor',
      roleKey: 'distributor',
      desc: 'All Distributor users list and details.',
      badge: 'Distributor',
      color: '#d97706',
      bgGlow: 'rgba(217, 119, 6, 0.15)',
      list: filterList(distributorsList),
      icon: Briefcase,
    },
    partners: {
      title: 'Partner',
      singular: 'Partner',
      roleKey: 'partner',
      desc: 'All Partner users list and details.',
      badge: 'Partner',
      color: '#0891b2',
      bgGlow: 'rgba(8, 145, 178, 0.15)',
      list: filterList(partnersList),
      icon: Sun,
    },
    financers: {
      title: 'Financer',
      singular: 'Financer',
      roleKey: 'financer',
      desc: 'All Financer users list and details.',
      badge: 'Financer',
      color: '#16a34a',
      bgGlow: 'rgba(22, 163, 74, 0.15)',
      list: filterList(financersList),
      icon: Banknote,
    },
    agents: {
      title: 'Agent',
      singular: 'Agent',
      roleKey: 'agent',
      desc: 'All Agent users list and details.',
      badge: 'Agent',
      color: '#059669',
      bgGlow: 'rgba(5, 150, 105, 0.15)',
      list: filterList(agentsList),
      icon: Users,
    },
    installers: {
      title: 'Installer',
      singular: 'Installer',
      roleKey: 'installer',
      desc: 'All Installer users list and details.',
      badge: 'Installer',
      color: '#7c3aed',
      bgGlow: 'rgba(124, 58, 237, 0.15)',
      list: filterList(installersList),
      icon: Wrench,
    },
    consumers: {
      title: 'User',
      singular: 'User',
      roleKey: 'user',
      desc: 'All User accounts list and details.',
      badge: 'User',
      color: '#eab308',
      bgGlow: 'rgba(234, 179, 8, 0.15)',
      list: filterList(consumersList),
      icon: UserCheck,
    },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090d16', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      {/* -------------------- LEFT ENTERPRISE SIDEBAR -------------------- */}
      <aside
        style={{
          width: '280px',
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
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Sun size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                SolarConnect
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Super Admin
              </div>
            </div>
          </div>
        </div>

        {/* Master HQ Admin Status Card */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(30, 27, 75, 0.4) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Super Admin</div>
              <div style={{ fontSize: '10px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* 1. Overview */}
            <button
              onClick={() => setActiveSection('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'overview' ? '#4f46e5' : 'transparent',
                color: activeSection === 'overview' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={17} color={activeSection === 'overview' ? '#fff' : '#818cf8'} />
                <span>Overview</span>
              </div>
            </button>

            {/* 2. Admin */}
            <button
              onClick={() => setActiveSection('admins')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'admins' ? '#0284c7' : 'transparent',
                color: activeSection === 'admins' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={17} color={activeSection === 'admins' ? '#fff' : '#38bdf8'} />
                <span>Admin</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {adminsList.length}
              </span>
            </button>

            {/* 3. Distributor */}
            <button
              onClick={() => setActiveSection('distributors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'distributors' ? '#d97706' : 'transparent',
                color: activeSection === 'distributors' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={17} color={activeSection === 'distributors' ? '#fff' : '#f59e0b'} />
                <span>Distributor</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {distributorsList.length}
              </span>
            </button>

            {/* 4. Partner */}
            <button
              onClick={() => setActiveSection('partners')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'partners' ? '#0891b2' : 'transparent',
                color: activeSection === 'partners' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sun size={17} color={activeSection === 'partners' ? '#fff' : '#22d3ee'} />
                <span>Partner</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {partnersList.length}
              </span>
            </button>

            {/* 5. Financer */}
            <button
              onClick={() => setActiveSection('financers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'financers' ? '#16a34a' : 'transparent',
                color: activeSection === 'financers' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Banknote size={17} color={activeSection === 'financers' ? '#fff' : '#4ade80'} />
                <span>Financer</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {financersList.length}
              </span>
            </button>

            {/* 6. Agent */}
            <button
              onClick={() => setActiveSection('agents')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'agents' ? '#059669' : 'transparent',
                color: activeSection === 'agents' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={17} color={activeSection === 'agents' ? '#fff' : '#34d399'} />
                <span>Agent</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {agentsList.length}
              </span>
            </button>

            {/* 7. Installer */}
            <button
              onClick={() => setActiveSection('installers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'installers' ? '#7c3aed' : 'transparent',
                color: activeSection === 'installers' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wrench size={17} color={activeSection === 'installers' ? '#fff' : '#c084fc'} />
                <span>Installer</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {installersList.length}
              </span>
            </button>

            {/* 8. User */}
            <button
              onClick={() => setActiveSection('consumers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'consumers' ? '#ca8a04' : 'transparent',
                color: activeSection === 'consumers' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={17} color={activeSection === 'consumers' ? '#fff' : '#facc15'} />
                <span>User</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {consumersList.length}
              </span>
            </button>

            {/* 9. Applications */}
            <button
              onClick={() => setActiveSection('applications')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSection === 'applications' ? '#4f46e5' : 'transparent',
                color: activeSection === 'applications' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={17} color={activeSection === 'applications' ? '#fff' : '#818cf8'} />
                <span>Applications</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {applications.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
              <Server size={13} color="#10b981" />
              <span>Core Port: <strong>4000</strong></span>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              ONLINE
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* -------------------- MAIN WORKSPACE -------------------- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header Command Bar */}
        <header
          style={{
            height: '66px',
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
            <span>Super Admin</span>
            <ChevronRight size={14} />
            <span style={{ color: '#818cf8', fontWeight: 600 }}>
              {activeSection === 'overview' && 'Overview'}
              {activeSection === 'applications' && 'Applications'}
              {roleConfig[activeSection]?.title}
            </span>
          </div>

          {/* Quick Search */}
          <div style={{ width: '380px', position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across names, emails, territories, IDs..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: '#070b13',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Top Quick Create Action */}
          <div>
            {roleConfig[activeSection] && (
              <button
                onClick={() => handleOpenAddForSection(roleConfig[activeSection].roleKey)}
                style={{
                  background: roleConfig[activeSection].color,
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${roleConfig[activeSection].color}40`,
                }}
              >
                <Plus size={16} /> + Add {roleConfig[activeSection].singular}
              </button>
            )}
          </div>
        </header>

        {/* Workspace Body */}
        <main style={{ padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* ==================== VIEW 1: EXECUTIVE OVERVIEW ==================== */}
          {activeSection === 'overview' && (
            <div>
              {/* Hero Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #131d36 0%, #0d1527 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  marginBottom: '26px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                      SUPER ADMIN
                    </span>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>• Active</span>
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                    Super Admin Overview
                  </h1>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                    Manage all system users, partners, agents, and solar applications from one dashboard.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>TOTAL USERS</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{allUsersList.length}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>APPLICATIONS</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{applications.length}</div>
                  </div>
                </div>
              </div>

              {/* 7 Section Quick Jump Cards */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                All Sections
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {Object.entries(roleConfig).map(([key, cfg]) => {
                  const RoleIcon = cfg.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => setActiveSection(key)}
                      style={{
                        background: '#0d1527',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderTop: `3px solid ${cfg.color}`,
                        borderRadius: '14px',
                        padding: '18px 20px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase' }}>
                            {cfg.badge}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                            {cfg.title}
                          </div>
                        </div>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: cfg.bgGlow,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: cfg.color,
                          }}
                        >
                          <RoleIcon size={20} />
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>
                          {cfg.list.length} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Active</span>
                        </div>
                        <span style={{ fontSize: '12px', color: cfg.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Open Section <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 5-Tier Timeline */}
              <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    <Layers size={16} color="#818cf8" />
                    <span>System Roles Hierarchy</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Roles overview in the solar system</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <div style={{ background: 'rgba(79, 70, 229, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>1. Super Admin</strong>
                  </div>
                  <ChevronRight size={14} color="#64748b" />
                  <div style={{ background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.4)', borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>2. Admin ({adminsList.length})</strong>
                  </div>
                  <ChevronRight size={14} color="#64748b" />
                  <div style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.4)', borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>3. Distributor / Partner / Financer</strong>
                  </div>
                  <ChevronRight size={14} color="#64748b" />
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>4. Agent / Installer</strong>
                  </div>
                  <ChevronRight size={14} color="#64748b" />
                  <div style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <strong style={{ fontSize: '12px', color: '#fff' }}>5. User ({consumersList.length})</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== VIEW 2: DEDICATED STAKEHOLDER SECTION ==================== */}
          {roleConfig[activeSection] && (
            <div>
              {/* Section Header Card */}
              {(() => {
                const cfg = roleConfig[activeSection];
                const RoleIcon = cfg.icon;
                return (
                  <div
                    style={{
                      background: '#0d1527',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '22px 26px',
                      marginBottom: '22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background: cfg.bgGlow,
                          color: cfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RoleIcon size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {cfg.badge}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Total Registered: <strong>{cfg.list.length}</strong>
                          </span>
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '4px 0 2px' }}>
                          {cfg.title}
                        </h2>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, maxWidth: '650px' }}>
                          {cfg.desc}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleOpenAddForSection(cfg.roleKey)}
                        style={{
                          background: cfg.color,
                          color: '#fff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '9px',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: `0 4px 14px ${cfg.color}40`,
                        }}
                      >
                        <Plus size={16} /> Add {cfg.singular}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Section Table */}
              {(() => {
                const cfg = roleConfig[activeSection];
                const displayList = cfg.list;

                return (
                  <div
                    style={{
                      background: '#0d1527',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                            <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                              {cfg.singular} Name & Identity
                            </th>
                            <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                              Official Contact
                            </th>
                            <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                              Territory / Area
                            </th>
                            <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                              Password
                            </th>
                            <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                              Login
                            </th>
                            <th style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayList.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                                No {cfg.singular.toLowerCase()} records found. Click 'Add {cfg.singular}' above to create one.
                              </td>
                            </tr>
                          ) : (
                            displayList.map((item) => {
                              const isRevealed = revealedPasswords[item._id];
                              return (
                                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                  {/* Name & ID */}
                                  <td style={{ padding: '18px 22px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div
                                        style={{
                                          width: '38px',
                                          height: '38px',
                                          borderRadius: '10px',
                                          background: cfg.bgGlow,
                                          color: cfg.color,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 800,
                                          fontSize: '14px',
                                        }}
                                      >
                                        {item.fullName?.[0]?.toUpperCase() || 'U'}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                                          {item.fullName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          {item.companyName && <span>{item.companyName} •</span>}
                                          <span style={{ fontFamily: 'monospace', color: cfg.color, fontWeight: 700 }}>
                                            {item.code || item.executiveId || item.consumerNo || 'ID-OFFICIAL'}
                                          </span>
                                        </div>
                                        {/* Lineage Traceability Badges */}
                                        {item.role === 'distributor' && (
                                          <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ color: '#94a3b8' }}>Admin:</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                              {item.adminCode || 'ADM-101'}
                                            </span>
                                          </div>
                                        )}
                                        {(item.role === 'agent' || item.role === 'executive') && (
                                          <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ color: '#94a3b8' }}>Dist:</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                              {item.distributorCode || 'DST-101-01'}
                                            </span>
                                            <span style={{ color: '#64748b' }}>➔</span>
                                            <span style={{ color: '#94a3b8' }}>Admin:</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                              {item.adminCode || 'ADM-101'}
                                            </span>
                                          </div>
                                        )}
                                        {item.role === 'user' && (
                                          <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                            <span style={{ color: '#94a3b8' }}>Agent:</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                              {item.agentCode || 'AGT-101-01-01'}
                                            </span>
                                            <span style={{ color: '#64748b' }}>➔</span>
                                            <span style={{ color: '#94a3b8' }}>Dist:</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                              {item.distributorCode || 'DST-101-01'}
                                            </span>
                                            <span style={{ color: '#64748b' }}>➔</span>
                                            <span style={{ color: '#94a3b8' }}>Admin:</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                              {item.adminCode || 'ADM-101'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Contact */}
                                  <td style={{ padding: '18px 22px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                                      <Mail size={13} color="#94a3b8" />
                                      <span>{item.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', marginTop: '3px' }}>
                                      <Phone size={12} color="#64748b" />
                                      <span>{item.mobile || '—'}</span>
                                    </div>
                                  </td>

                                  {/* Territory */}
                                  <td style={{ padding: '18px 22px' }}>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: '#cbd5e1',
                                        padding: '4px 10px',
                                        borderRadius: '7px',
                                        fontSize: '12px',
                                      }}
                                    >
                                      <MapPin size={12} color={cfg.color} />
                                      {item.territory || 'National / Region'}
                                    </span>
                                  </td>

                                  {/* Password */}
                                  <td style={{ padding: '18px 22px' }}>
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '7px',
                                        padding: '4px 9px',
                                      }}
                                    >
                                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: isRevealed ? '#fff' : '#64748b' }}>
                                        {isRevealed ? item.password || 'solar@123' : '••••••••'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => togglePasswordReveal(item._id)}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                                        title="Show / Hide Password"
                                      >
                                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(item.password || 'solar@123', item._id)}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                                        title="Copy Password"
                                      >
                                        {copiedKey === item._id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                      </button>
                                    </div>
                                  </td>

                                  {/* Login Button */}
                                  <td style={{ padding: '18px 22px' }}>
                                    <button
                                      onClick={() => handleLoginAs(item)}
                                      style={{
                                        background: cfg.color,
                                        color: '#fff',
                                        border: 'none',
                                        padding: '7px 16px',
                                        borderRadius: '7px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: `0 3px 10px ${cfg.color}35`,
                                      }}
                                    >
                                      <ExternalLink size={13} /> Login
                                    </button>
                                  </td>

                                  {/* Actions */}
                                  <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button
                                        onClick={() => handleOpenEdit(item)}
                                        style={{
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          color: '#38bdf8',
                                          padding: '5px 10px',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(item._id, item.fullName)}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.1)',
                                          border: '1px solid rgba(239, 68, 68, 0.2)',
                                          color: '#f87171',
                                          padding: '5px 10px',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ==================== VIEW 3: SOLAR APPLICATIONS PIPELINE & ROUTING ==================== */}
          {activeSection === 'applications' && (
            <div>
              {/* Verification Engine Control & Partner Routing Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  marginBottom: '22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '18px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', background: systemSettings.verificationMode === 'AUTO' ? '#10b98125' : '#6366f125', color: systemSettings.verificationMode === 'AUTO' ? '#34d399' : '#818cf8', border: '1px solid ' + (systemSettings.verificationMode === 'AUTO' ? '#10b98150' : '#6366f150'), padding: '4px 10px', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {systemSettings.verificationMode === 'AUTO' ? '⚡ Mode: FAST-TRACK AUTO' : '🛡️ Mode: MANUAL SANCTION'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                      Lead Routing & Verification Protocol
                    </span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                    {systemSettings.verificationMode === 'AUTO'
                      ? 'Automatic Partner & Financer Dispatch Active'
                      : 'Distributor Verification ➔ Admin Approval Required'}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '6px 0 0', maxWidth: '650px' }}>
                    {systemSettings.verificationMode === 'AUTO'
                      ? 'When a Distributor verifies a lead, it immediately auto-sanctions and routes to their assigned EPC Partner and Financer without waiting on Admin desk.'
                      : 'When a Distributor verifies a lead, it is placed in the Admin Action Queue below. Admin can inspect documents, select or confirm EPC Partner & Financer, and Sanction or Reject.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleToggleVerificationMode}
                    style={{
                      background: systemSettings.verificationMode === 'AUTO' ? '#4f46e5' : '#059669',
                      color: '#fff',
                      border: 'none',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    }}
                  >
                    Switch to {systemSettings.verificationMode === 'AUTO' ? '🛡️ Manual Mode' : '⚡ Auto Fast-Track Mode'}
                  </button>

                  <button
                    onClick={() => {
                      if (distributorsList.length > 0) {
                        setMappingDistributorId(distributorsList[0]._id);
                        const existing = systemSettings.distributorPartnerMapping[distributorsList[0]._id];
                        setMappingPartnerId(existing?.partnerId || (partnersList[0]?._id || ''));
                        setMappingFinancerId(existing?.financerId || (financersList[0]?._id || ''));
                      }
                      setShowMappingModal(true);
                      setMappingMsg('');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '11px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⚙️ Configure Distributor Routing
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: `All Applications (${applications.length})` },
                  {
                    key: 'DIST_VERIFIED',
                    label: `Action Required: Waiting Admin Sanction (${applications.filter((a) => (a.overallStatus || '') === 'Distributor_Verified').length})`,
                    color: '#38bdf8',
                  },
                  {
                    key: 'PENDING_DIST',
                    label: `Pending Distributor Check (${applications.filter((a) => (a.overallStatus || 'Pending_Distributor') === 'Pending_Distributor').length})`,
                    color: '#f59e0b',
                  },
                  {
                    key: 'ASSIGNED',
                    label: `Assigned to Partner (${applications.filter((a) => ['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(a.overallStatus)).length})`,
                    color: '#10b981',
                  },
                  {
                    key: 'REJECTED',
                    label: `Rejected (${applications.filter((a) => ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(a.overallStatus) || a.verification?.status === 'Rejected').length})`,
                    color: '#ef4444',
                  },
                ].map((f) => {
                  const isActive = appFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setAppFilter(f.key)}
                      style={{
                        background: isActive ? (f.color || '#4f46e5') : '#0d1527',
                        color: isActive ? '#fff' : '#94a3b8',
                        border: '1px solid ' + (isActive ? 'transparent' : 'rgba(255,255,255,0.08)'),
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Applications Table */}
              <div
                style={{
                  background: '#0d1527',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#64748b' }}>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Consumer Reg ID & Date</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Applicant Particulars</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Hierarchy Lineage</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>10-Point Survey Documents</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Lifecycle Status</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Partner & Financer</th>
                        <th style={{ padding: '14px 22px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Admin Sanction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications
                        .filter((a) => {
                          const s = a.overallStatus || (a.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
                          if (appFilter === 'DIST_VERIFIED') return s === 'Distributor_Verified';
                          if (appFilter === 'PENDING_DIST') return s === 'Pending_Distributor';
                          if (appFilter === 'ASSIGNED') return ['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(s);
                          if (appFilter === 'REJECTED') return ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(s) || a.verification?.status === 'Rejected';
                          return true;
                        })
                        .map((app) => {
                          const status = app.overallStatus || (app.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
                          const isDistVerified = status === 'Distributor_Verified';
                          const isPendingDist = status === 'Pending_Distributor';
                          const isAssigned = ['Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'Installation_Complete'].includes(status);
                          const isDistRejected = status === 'Rejected_By_Distributor';
                          const isAdminRejected = status === 'Rejected_By_Admin';

                          return (
                            <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <td style={{ padding: '18px 22px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                    {app.registrationId}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    {app.issuedOn ? new Date(app.issuedOn).toLocaleDateString() : 'Today'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '18px 22px' }}>
                                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{app.fullName}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                  📞 {app.mobile} {app.alternateNo ? `| Alt: ${app.alternateNo}` : ''}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  CA: {app.consumerNo} | {app.districtCity || 'State Zone'}
                                </div>
                              </td>
                              <td style={{ padding: '18px 22px' }}>
                                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                                  Agent: <strong>{app.agentName || app.executiveName || 'Field Agent'}</strong>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  Dist: {app.distributorName || 'Nandani Enterprise'} ({app.distributorCode || 'DST-101-01'})
                                </div>
                              </td>
                              <td style={{ padding: '18px 22px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                                  <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: app.documents?.aadhaarCard?.collected ? '#065f4625' : '#ef444420', color: app.documents?.aadhaarCard?.collected ? '#34d399' : '#f87171' }}>
                                    Aadhaar {app.aadhaarNumber ? `✓` : ''}
                                  </span>
                                  <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: app.documents?.panCard?.collected ? '#065f4625' : '#ef444420', color: app.documents?.panCard?.collected ? '#34d399' : '#f87171' }}>
                                    PAN {app.panNumber ? `✓` : ''}
                                  </span>
                                  <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: app.documents?.bijliBill?.collected ? '#065f4625' : '#ef444420', color: app.documents?.bijliBill?.collected ? '#34d399' : '#f87171' }}>
                                    Bijli Bill
                                  </span>
                                  <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: app.documents?.bankPassbook?.collected ? '#065f4625' : '#ef444420', color: app.documents?.bankPassbook?.collected ? '#34d399' : '#f87171' }}>
                                    Passbook
                                  </span>
                                  <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: app.documents?.jaminRasid?.collected ? '#065f4625' : '#ef444420', color: app.documents?.jaminRasid?.collected ? '#34d399' : '#f87171' }}>
                                    Jamin Rasid
                                  </span>
                                  <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '4px', background: app.documents?.rooftopGpsPhoto?.collected ? '#065f4625' : '#ef444420', color: app.documents?.rooftopGpsPhoto?.collected ? '#34d399' : '#f87171' }}>
                                    GPS Photo
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '18px 22px' }}>
                                {isDistVerified && (
                                  <span style={{ background: '#0284c725', color: '#38bdf8', border: '1px solid #0284c750', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={11} /> Dist Verified ➔ Needs Admin Action
                                  </span>
                                )}
                                {isPendingDist && (
                                  <span style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={11} /> Pending Distributor Check
                                  </span>
                                )}
                                {isAssigned && (
                                  <span style={{ background: '#10b98120', color: '#34d399', border: '1px solid #10b98140', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={11} /> Approved & Dispatched
                                  </span>
                                )}
                                {isDistRejected && (
                                  <div>
                                    <span style={{ background: '#ef444420', color: '#f87171', border: '1px solid #ef444440', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <XCircle size={11} /> Rejected by Distributor
                                    </span>
                                    {app.distributorVerification?.rejectionReason && (
                                      <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px' }}>
                                        "{app.distributorVerification.rejectionReason}"
                                      </div>
                                    )}
                                  </div>
                                )}
                                {isAdminRejected && (
                                  <div>
                                    <span style={{ background: '#ea580c20', color: '#fb923c', border: '1px solid #ea580c40', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <XCircle size={11} /> Rejected by Admin
                                    </span>
                                    {app.adminVerification?.rejectionReason && (
                                      <div style={{ fontSize: '10px', color: '#fb923c', marginTop: '3px' }}>
                                        "{app.adminVerification.rejectionReason}"
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '18px 22px' }}>
                                <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>
                                  {app.partnerDetails?.partnerName || '—'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Financer: {app.financingDetails?.financerName || '—'}
                                </div>
                              </td>
                              <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                                <button
                                  onClick={() => {
                                    setAdminAuditLead(app);
                                    // Pre-populate with mapped partner & financer if available
                                    const distId = app.distributorId || 'seed_distributor_01';
                                    const mapped = systemSettings.distributorPartnerMapping[distId];
                                    setSelectedEpcPartnerId(mapped?.partnerId || partnersList[0]?._id || '');
                                    setSelectedFinancerId(mapped?.financerId || financersList[0]?._id || '');
                                    setShowAdminRejectInput(false);
                                    setAdminRejectReason('');
                                    setAuditMsg('');
                                  }}
                                  style={{
                                    background: isDistVerified ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#1e293b',
                                    color: isDistVerified ? '#fff' : '#94a3b8',
                                    border: isDistVerified ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    padding: '7px 14px',
                                    borderRadius: '7px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: isDistVerified ? '0 3px 10px rgba(2, 132, 199, 0.4)' : 'none',
                                  }}
                                >
                                  <Eye size={13} /> {isDistVerified ? 'Review & Sanction' : 'View Audit'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {applications.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                            No consumer applications logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* -------------------- DYNAMIC CREATE MODAL -------------------- */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                  Add New {createRole === 'user' ? 'User' : createRole.charAt(0).toUpperCase() + createRole.slice(1)}
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Fill details to create a new account</div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              {/* Parent Linkage Dropdown */}
              {createRole === 'distributor' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '5px' }}>
                    Select Admin
                  </label>
                  <select
                    value={formData.adminId}
                    onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #38bdf8', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {adminsList.map((adm) => (
                      <option key={adm._id} value={adm._id}>
                        {adm.code || adm.executiveId || 'ADM-101'} — {adm.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createRole === 'agent' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '5px' }}>
                    Select Distributor
                  </label>
                  <select
                    value={formData.distributorId}
                    onChange={(e) => setFormData({ ...formData, distributorId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #f59e0b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {distributorsList.map((dst) => (
                      <option key={dst._id} value={dst._id}>
                        {dst.code || dst.executiveId || 'DST-101-01'} — {dst.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createRole === 'installer' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#818cf8', marginBottom: '5px' }}>
                    Select Partner
                  </label>
                  <select
                    value={formData.partnerId}
                    onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #818cf8', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {partnersList.map((prt) => (
                      <option key={prt._id} value={prt._id}>
                        {prt.code || prt.executiveId || 'PRT-101-01'} — {prt.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createRole === 'user' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '5px' }}>
                    Select Agent
                  </label>
                  <select
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #10b981', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {agentsList.map((agt) => (
                      <option key={agt._id} value={agt._id}>
                        {agt.code || agt.executiveId || 'AGT-101-01-01'} — {agt.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Full Name / Official Rep</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Suresh Patel"
                  style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {createRole !== 'user' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Company / Agency / Bank / Hub Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Patel Solar Hub LLP"
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {createRole === 'user' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Consumer CA / Account Number</label>
                  <input
                    type="text"
                    value={formData.consumerNo}
                    onChange={(e) => setFormData({ ...formData, consumerNo: e.target.value })}
                    placeholder="e.g. CA-10293847"
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Official Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. user@solar.com"
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Mobile Number</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. 9811223344"
                    style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Assigned Territory / Area</label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  placeholder="e.g. Delhi NCR / Gujarat"
                  style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Password</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              {createMsg && <div style={{ marginBottom: '14px', color: '#f87171', fontSize: '13px' }}>{createMsg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Add Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- EDIT MODAL -------------------- */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>Edit: {editUser.fullName} ({editUser.role?.toUpperCase()})</h3>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Full Name</label>
                <input type="text" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Company / Organization</label>
                <input type="text" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Email</label>
                  <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Mobile</label>
                  <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>Territory / Location</label>
                <input type="text" value={editForm.territory} onChange={(e) => setEditForm({ ...editForm, territory: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '5px' }}>
                  <Key size={13} /> Update Password
                </label>
                <input type="text" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Enter new password" style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              {editMsg && <div style={{ marginBottom: '14px', color: '#f87171', fontSize: '13px' }}>{editMsg}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditUser(null)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: '#38bdf8', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- ADMIN SANCTION & AUDIT MODAL -------------------- */}
      {adminAuditLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '20px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
                  <ShieldCheck size={16} /> Admin Final Sanction & Partner Dispatch Desk
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 2px', color: '#f8fafc' }}>
                  {adminAuditLead.fullName} — {adminAuditLead.registrationId}
                </h2>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Distributor Verified by: <strong style={{ color: '#f59e0b' }}>{adminAuditLead.distributorVerification?.verifiedBy || adminAuditLead.distributorName || 'Distributor Desk'}</strong> | CA ID: <strong style={{ color: '#fff' }}>{adminAuditLead.consumerNo}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminAuditLead(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {auditMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', background: auditMsg.startsWith('✅') ? '#065f4630' : '#ef444425', border: '1px solid ' + (auditMsg.startsWith('✅') ? '#05966950' : '#ef444450'), color: auditMsg.startsWith('✅') ? '#34d399' : '#f87171', fontSize: '14px', fontWeight: 600 }}>
                {auditMsg}
              </div>
            )}

            {/* Applicant Details */}
            <div style={{ background: '#070b13', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Mobile</span>
                  <strong style={{ color: '#f8fafc' }}>{adminAuditLead.mobile}</strong>
                  {adminAuditLead.alternateNo && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Alt: {adminAuditLead.alternateNo}</div>}
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Email</span>
                  <strong style={{ color: '#f8fafc' }}>{adminAuditLead.email || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Monthly Bill</span>
                  <strong style={{ color: '#f59e0b' }}>₹{adminAuditLead.avgMonthlyBill?.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Rooftop Area</span>
                  <strong style={{ color: '#10b981' }}>{adminAuditLead.rooftopArea || 0} Sq. Ft ({adminAuditLead.roofType || 'RCC'})</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Address</span>
                  <strong style={{ color: '#f8fafc' }}>{adminAuditLead.propertyAddress || adminAuditLead.address}</strong>
                </div>
              </div>
            </div>

            {/* 10-Point Survey Verification Grid */}
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#f59e0b', margin: '0 0 12px', fontWeight: 700 }}>
              10-Point Survey Audit Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '22px' }}>
              <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>1. Aadhaar Card</div>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace', margin: '3px 0' }}>{adminAuditLead.aadhaarNumber || 'In Attached Document'}</div>
                <span style={{ fontSize: '11px', color: adminAuditLead.documents?.aadhaarCard?.collected ? '#34d399' : '#f87171' }}>
                  {adminAuditLead.documents?.aadhaarCard?.collected ? '✓ Photo Verified' : 'Missing'}
                </span>
              </div>
              <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>2. PAN Card</div>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace', margin: '3px 0' }}>{adminAuditLead.panNumber || 'In Attached Document'}</div>
                <span style={{ fontSize: '11px', color: adminAuditLead.documents?.panCard?.collected ? '#34d399' : '#f87171' }}>
                  {adminAuditLead.documents?.panCard?.collected ? '✓ Photo Verified' : 'Missing'}
                </span>
              </div>
              <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>3. Bijli Bill / CA ID</div>
                <div style={{ fontSize: '12px', color: '#f59e0b', fontFamily: 'monospace', margin: '3px 0' }}>{adminAuditLead.consumerNo}</div>
                <span style={{ fontSize: '11px', color: adminAuditLead.documents?.bijliBill?.collected ? '#34d399' : '#f87171' }}>
                  {adminAuditLead.documents?.bijliBill?.collected ? '✓ Bill Verified' : 'Missing'}
                </span>
              </div>
              <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>4. Bank Passbook (DBT)</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', margin: '3px 0' }}>
                  A/C: {adminAuditLead.bankDetails?.accountNumber || adminAuditLead.accountNumber || '—'}
                </div>
                <span style={{ fontSize: '11px', color: adminAuditLead.documents?.bankPassbook?.collected ? '#34d399' : '#f87171' }}>
                  {adminAuditLead.documents?.bankPassbook?.collected ? '✓ Passbook Verified' : 'Missing'}
                </span>
              </div>
              <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>5. Jamin ka Rasid</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', margin: '3px 0' }}>{adminAuditLead.landDetails || 'Deed Verified'}</div>
                <span style={{ fontSize: '11px', color: adminAuditLead.documents?.jaminRasid?.collected ? '#34d399' : '#f87171' }}>
                  {adminAuditLead.documents?.jaminRasid?.collected ? '✓ Rasid Verified' : 'Missing'}
                </span>
              </div>
              <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>6. Rooftop GPS Photo</div>
                <div style={{ fontSize: '12px', color: '#10b981', margin: '3px 0' }}>
                  {adminAuditLead.documents?.rooftopGpsPhoto?.gpsLatitude || '26.9124° N'}, {adminAuditLead.documents?.rooftopGpsPhoto?.gpsLongitude || '75.7873° E'}
                </div>
                <span style={{ fontSize: '11px', color: '#34d399' }}>✓ Live GPS Geotag Active</span>
              </div>
            </div>

            {/* Select Partner & Financer for Allocation */}
            <div style={{ background: '#070b13', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '18px', marginBottom: '22px' }}>
              <h4 style={{ fontSize: '14px', color: '#38bdf8', margin: '0 0 14px', fontWeight: 700 }}>
                Select EPC Partner & Financer to Assign
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Assign Solar EPC Partner
                  </label>
                  <select
                    value={selectedEpcPartnerId}
                    onChange={(e) => setSelectedEpcPartnerId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    {partnersList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.fullName || p.companyName} ({p.code || 'PRT'})
                      </option>
                    ))}
                    {partnersList.length === 0 && <option value="seed_partner_01">Solarize (PRT-101-01)</option>}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Assign Solar Financer (PM Surya Loan)
                  </label>
                  <select
                    value={selectedFinancerId}
                    onChange={(e) => setSelectedFinancerId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    {financersList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.fullName || f.companyName} ({f.code || 'FIN'})
                      </option>
                    ))}
                    {financersList.length === 0 && <option value="seed_financer_01">SBI (FIN-101-01)</option>}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ background: '#070b13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
              {!showAdminRejectInput ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>Admin Sanction Action</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Approve to dispatch lead directly to the selected EPC Partner & Financer.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAdminRejectInput(true)}
                      style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      ✕ Reject Application
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminApproveLead(adminAuditLead)}
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                    >
                      <Check size={16} /> Sanction & Assign to Partner
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '14px', marginBottom: '8px' }}>
                    Specify Admin Rejection Reason (Visible to Agent, Consumer & Distributor):
                  </div>
                  <textarea
                    rows={2}
                    value={adminRejectReason}
                    onChange={(e) => setAdminRejectReason(e.target.value)}
                    placeholder="e.g. Sanctioned load exceeds rooftop structural capacity; DISCOM discrepancy..."
                    style={{ width: '100%', padding: '10px 12px', background: '#0d1527', border: '1px solid #ef444450', borderRadius: '8px', color: '#fff', boxSizing: 'border-box', marginBottom: '12px' }}
                  ></textarea>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowAdminRejectInput(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => handleAdminRejectLead(adminAuditLead)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DISTRIBUTOR ROUTING CONFIG MODAL -------------------- */}
      {showMappingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ background: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '20px', maxWidth: '520px', width: '100%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                  Distributor ➔ EPC Partner & Financer Routing
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Assign which Partner & Financer receives leads from each Distributor</div>
              </div>
              <button type="button" onClick={() => setShowMappingModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleSaveDistributorMapping}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '6px' }}>
                  1. Select Distributor
                </label>
                <select
                  value={mappingDistributorId}
                  onChange={(e) => {
                    const dId = e.target.value;
                    setMappingDistributorId(dId);
                    const existing = systemSettings.distributorPartnerMapping[dId];
                    if (existing) {
                      setMappingPartnerId(existing.partnerId || '');
                      setMappingFinancerId(existing.financerId || '');
                    }
                  }}
                  style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  {distributorsList.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fullName} ({d.code || 'DST'})
                    </option>
                  ))}
                  {distributorsList.length === 0 && <option value="seed_distributor_01">Nandani Enterprise (DST-101-01)</option>}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>
                  2. Route Leads to EPC Partner
                </label>
                <select
                  value={mappingPartnerId}
                  onChange={(e) => setMappingPartnerId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  {partnersList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName || p.companyName} ({p.code || 'PRT'})
                    </option>
                  ))}
                  {partnersList.length === 0 && <option value="seed_partner_01">Solarize (PRT-101-01)</option>}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#10b981', marginBottom: '6px' }}>
                  3. Route Financing to Loan Partner
                </label>
                <select
                  value={mappingFinancerId}
                  onChange={(e) => setMappingFinancerId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#070b13', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  {financersList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.fullName || f.companyName} ({f.code || 'FIN'})
                    </option>
                  ))}
                  {financersList.length === 0 && <option value="seed_financer_01">SBI (FIN-101-01)</option>}
                </select>
              </div>

              {mappingMsg && (
                <div style={{ marginBottom: '14px', fontSize: '13px', color: mappingMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>
                  {mappingMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowMappingModal(false)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Save Routing Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
