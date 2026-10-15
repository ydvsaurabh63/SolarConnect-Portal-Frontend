import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Banknote,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  LayoutDashboard,
  Search,
  LogOut,
  Globe,
  RefreshCw,
  Building2,
  Percent,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Eye,
  UserCheck,
  Calculator,
  Zap,
  Home,
  MapPin,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  HelpCircle,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import DashboardMobileNav from '../components/DashboardMobileNav';
import DocumentComparisonCards from '../components/DocumentComparisonCards';

// PM Surya Ghar Green Solar Financing Calculator
export const calculateSolarFinance = (app, customSanctionAmount, tenureYrs = 5) => {
  const avgBill = Number(app?.avgMonthlyBill) || 4200;
  // Rule of thumb: ~₹1,300 monthly bill equates to approx 1 kW
  const recommendedKw = Math.max(1, Math.min(10, Math.round((avgBill / 1300) * 10) / 10));
  
  // Benchmark system cost: ~₹58,000 per kW (IREDA / MNRE standard benchmark)
  const benchmarkCost = Math.round(recommendedKw * 58000);
  
  // Central Govt DBT Subsidy under PM Surya Ghar Muft Bijli Yojana:
  // 1 kW = ₹30,000
  // 2 kW = ₹60,000
  // 3 kW or more = ₹78,000 maximum
  let centralSubsidy = 0;
  if (recommendedKw <= 1) {
    centralSubsidy = 30000;
  } else if (recommendedKw <= 2) {
    centralSubsidy = 30000 + Math.round((recommendedKw - 1) * 30000);
  } else {
    centralSubsidy = 78000;
  }

  // Net borrower outlay after Central DBT Subsidy
  const netPayable = Math.max(20000, benchmarkCost - centralSubsidy);
  
  // Loan Principal
  const principal = Number(customSanctionAmount) > 0 ? Number(customSanctionAmount) : netPayable;
  
  // Subsidized Interest Rate: 7.0% per annum under PM Surya Ghar
  const annualRate = 0.07;
  const monthlyRate = annualRate / 12;
  const numYears = Number(tenureYrs) || 5;
  const totalMonths = numYears * 12;
  
  // Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyEmi = Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );

  // Solar generation: ~120 kWh (units) per kW per month
  const estMonthlyGenUnits = Math.round(recommendedKw * 120);
  // Average retail discom residential tariff: ~₹7 / unit
  const estMonthlySolarSavings = Math.round(estMonthlyGenUnits * 7);
  const netMonthlyGain = estMonthlySolarSavings - monthlyEmi;

  return {
    recommendedKw,
    benchmarkCost,
    centralSubsidy,
    netPayable,
    principal,
    monthlyEmi,
    totalMonths,
    numYears,
    estMonthlyGenUnits,
    estMonthlySolarSavings,
    netMonthlyGain,
    isAffordable: estMonthlySolarSavings >= monthlyEmi,
  };
};

export default function FinancerDashboard() {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'loans' | 'guidelines' | 'profile'
  const [searchQuery, setSearchQuery] = useState('');
  const [loanFilter, setLoanFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Decision Modal State & Tabs
  const [decisionModalApp, setDecisionModalApp] = useState(null);
  const [modalTab, setModalTab] = useState('calculator'); // 'calculator' | 'kyc' | 'discom' | 'documents'
  const [decisionType, setDecisionType] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [sanctionAmount, setSanctionAmount] = useState('105000');
  const [interestRate, setInterestRate] = useState('7.0% p.a. (Subsidized Green Credit)');
  const [tenureYears, setTenureYears] = useState(5);
  const [decisionRemarks, setDecisionRemarks] = useState('PM Surya Ghar priority green loan approved based on DISCOM bill KYC.');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const res = await api.getSubmissionLog();
      if (res.success) {
        setLoans(res.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/financer/login');
  };

  const handleOpenDecisionModal = (app, type = 'APPROVE', initialTab = 'calculator') => {
    setDecisionModalApp(app);
    setDecisionType(type);
    setModalTab(initialTab);
    
    const calc = calculateSolarFinance(app, null, 5);
    const initialAmount = app.financingDetails?.loanAmount > 0 
      ? app.financingDetails.loanAmount 
      : calc.netPayable;

    setSanctionAmount(String(initialAmount));
    setTenureYears(5);
    setInterestRate('7.0% p.a. (PM Surya Ghar Subsidized)');

    if (type === 'APPROVE') {
      setDecisionRemarks('PM Surya Ghar priority green loan sanctioned at 7.0% p.a. Verified DISCOM repayment history and Central DBT subsidy eligibility.');
    } else {
      setDecisionRemarks('Loan application declined due to credit benchmark / utility arrears / document mismatch.');
    }
  };

  const handleConfirmDecision = async (e) => {
    if (e) e.preventDefault();
    if (!decisionModalApp) return;

    setSubmittingDecision(true);
    try {
      if (decisionType === 'APPROVE') {
        await api.financeVerify(
          decisionModalApp._id,
          'Approved',
          Number(sanctionAmount),
          decisionRemarks,
          currentUser?._id,
          currentUser?.fullName || 'SBI'
        );
      } else {
        await api.financeVerify(
          decisionModalApp._id,
          'Rejected',
          0,
          decisionRemarks,
          currentUser?._id,
          currentUser?.fullName || 'SBI'
        );
      }

      setDecisionModalApp(null);
      await loadLoans();
    } catch (err) {
      console.error('Error confirming finance decision:', err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Live calculation for currently viewed application
  const activeCalc = useMemo(() => {
    if (!decisionModalApp) return null;
    return calculateSolarFinance(decisionModalApp, sanctionAmount, tenureYears);
  }, [decisionModalApp, sanctionAmount, tenureYears]);

  // Search filtered applications
  const filteredLoans = useMemo(() => {
    return loans
      .filter((app) => {
        const st = app.financingDetails?.status || 'Pending';
        if (loanFilter === 'PENDING') return st === 'Pending';
        if (loanFilter === 'APPROVED') return st === 'Approved';
        if (loanFilter === 'REJECTED') return st === 'Rejected';
        return true;
      })
      .filter((app) =>
        app.registrationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.consumerNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.districtCity?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [loans, loanFilter, searchQuery]);

  const pendingCount = loans.filter((l) => (l.financingDetails?.status || 'Pending') === 'Pending').length;
  const approvedCount = loans.filter((l) => l.financingDetails?.status === 'Approved').length;
  const rejectedCount = loans.filter((l) => l.financingDetails?.status === 'Rejected').length;
  const totalSanctionedSum = loans
    .filter((l) => l.financingDetails?.status === 'Approved')
    .reduce((sum, l) => sum + (l.financingDetails?.loanAmount || 0), 0);

  const renderMobileLoanCard = (loan) => {
    const st = loan.financingDetails?.status || 'Pending';
    const isApproved = st === 'Approved';
    const isRejected = st === 'Rejected';

    return (
      <div key={loan._id} className="mobile-app-card">
        <div className="mac-top">
          <div className="mac-name-group">
            <span className="mac-name" onClick={() => handleOpenDecisionModal(loan, 'APPROVE')}>{loan.fullName}</span>
            <span className="mac-reg">{loan.registrationId}</span>
          </div>
          <span 
            className="mac-status-badge"
            style={{
              color: isApproved ? '#34d399' : isRejected ? '#f87171' : '#f59e0b',
              background: isApproved ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              borderColor: isApproved ? 'rgba(16, 185, 129, 0.3)' : isRejected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            }}
          >
            {isApproved ? <CheckCircle2 size={11} /> : isRejected ? <XCircle size={11} /> : <Clock size={11} />}
            {st}
          </span>
        </div>

        <div className="mac-meta-row">
          <div className="mac-meta-item">
            <span className="mac-meta-label">Loan Req</span>
            <span className="mac-meta-val">₹{(loan.financingDetails?.loanAmount || 150000).toLocaleString('en-IN')}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">CA No.</span>
            <span className="mac-meta-val">{loan.consumerNo}</span>
          </div>
          <div className="mac-meta-item">
            <span className="mac-meta-label">Mobile</span>
            <span className="mac-meta-val">{loan.mobile}</span>
          </div>
        </div>

        <div className="mac-actions">
          <button 
            type="button" 
            className="mac-action-btn receipt"
            onClick={() => handleOpenDecisionModal(loan, 'APPROVE', 'calculator')}
            style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none' }}
          >
            <Eye size={13} /> Review & Sanction
          </button>
          {st === 'Pending' ? (
            <button 
              type="button" 
              className="mac-action-btn"
              onClick={() => handleOpenDecisionModal(loan, 'REJECT', 'calculator')}
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <XCircle size={13} /> Decline
            </button>
          ) : (
            <button 
              type="button" 
              className="mac-action-btn view"
              onClick={() => handleOpenDecisionModal(loan, 'APPROVE', 'calculator')}
            >
              <CheckCircle2 size={13} /> View Audit
            </button>
          )}
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
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              }}
            >
              <Banknote size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                SolarConnect
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Financer
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(30, 41, 59, 0.6) 100%)',
              border: '1px solid rgba(74, 222, 128, 0.25)',
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
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {currentUser?.fullName?.[0] || 'F'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.fullName || 'Financer'}
              </div>
              <div style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
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
                background: activeTab === 'overview' ? 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                color: activeTab === 'overview' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard size={17} color={activeTab === 'overview' ? '#fff' : '#16a34a'} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'loans' ? 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                color: activeTab === 'loans' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Banknote size={17} color={activeTab === 'loans' ? '#fff' : '#4ade80'} />
                <span>Loans</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {loans.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: activeTab === 'guidelines' ? 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                color: activeTab === 'guidelines' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={17} color={activeTab === 'guidelines' ? '#fff' : '#38bdf8'} />
                <span>Guidelines</span>
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
                background: activeTab === 'profile' ? 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                color: activeTab === 'profile' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={17} color={activeTab === 'profile' ? '#fff' : '#f59e0b'} />
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
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
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
          role="Financer"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          tabs={[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'loans', label: 'Loans', icon: Banknote, badge: pendingCount },
            { id: 'guidelines', label: 'Rules', icon: ShieldCheck },
            { id: 'profile', label: 'Profile', icon: UserCheck },
          ]}
        />
        {/* Impersonation Banner */}
        {currentUser?.isImpersonated && (
          <div
            style={{
              background: 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)',
              color: '#fff',
              padding: '9px 28px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>👁️ <strong>IMPERSONATION SESSION:</strong> Operating as Financer <strong>{currentUser.fullName}</strong>.</span>
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
            <span style={{ color: '#cbd5e1' }}>Financer</span>
            <span>/</span>
            <span style={{ color: '#4ade80', fontWeight: 600, textTransform: 'capitalize' }}>{activeTab}</span>
          </div>

          {/* Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by Reg ID, CA, Name..."
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
              onClick={loadLoans}
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                color: '#4ade80',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              NBFC Sanction Desk Active
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        {/* Main Content Workspace */}
        <main className="dashboard-main-content" style={{ padding: '28px', maxWidth: '1400px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          {/* 4 Rich KPI Metric Cards */}
          <div className="dashboard-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('loans'); setLoanFilter('ALL'); }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Loan Requests Pipeline</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#4ade80', marginTop: '12px' }}>{loans.length}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>PM Surya Ghar consumer requests</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('loans'); setLoanFilter('PENDING'); }}
              style={{
                background: pendingCount > 0 ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid ' + (pendingCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>Pending Credit Audits</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', marginTop: '12px' }}>{pendingCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#fbbf24', marginTop: '6px' }}>Needs KYC & loan sanction action</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('loans'); setLoanFilter('APPROVED'); }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Sanctioned Portfolio</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '12px' }}>₹{totalSanctionedSum.toLocaleString('en-IN')}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>{approvedCount} Loans approved at 7% p.a.</div>
            </div>

            <div
              className="kpi-metric-card"
              onClick={() => { setActiveTab('loans'); setLoanFilter('REJECTED'); }}
              style={{
                background: rejectedCount > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(30, 41, 59, 0.7)',
                border: '1px solid ' + (rejectedCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
              }}
            >
              <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-title" style={{ fontSize: '13px', color: rejectedCount > 0 ? '#f87171' : '#94a3b8', fontWeight: 600 }}>Declined Applications</span>
                <div className="kpi-icon-badge" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                  <XCircle size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '32px', fontWeight: 800, color: rejectedCount > 0 ? '#f87171' : '#f8fafc', marginTop: '12px' }}>{rejectedCount}</div>
              <div className="kpi-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>CIBIL / Document discrepancy</div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Banknote size={19} color="#4ade80" /> Priority Green Credit Queue
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Assess consumer subsidy eligibility, average DISCOM electricity bill, and sanction low-interest green loans.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('loans')}
                    style={{ background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.3)', color: '#4ade80', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All Applications ({loans.length})
                  </button>
                </div>

                <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px 16px' }}>Application ID</th>
                        <th style={{ padding: '12px 16px' }}>Applicant</th>
                        <th style={{ padding: '12px 16px' }}>Monthly Bill & Capacity</th>
                        <th style={{ padding: '12px 16px' }}>Loan Status</th>
                        <th style={{ padding: '12px 16px' }}>Sanction Amount</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Credit Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.slice(0, 5).map((app) => (
                        <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f59e0b' }}>{app.registrationId}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                            <div>{app.fullName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>CA: {app.consumerNo} | {app.districtCity}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                            <div>₹{app.avgMonthlyBill?.toLocaleString('en-IN') || 0} / mo</div>
                            <div style={{ fontSize: '11px', color: '#38bdf8' }}>Est. ~3 kW Rooftop</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: app.financingDetails?.status === 'Approved' ? '#065f4625' : '#f59e0b20', color: app.financingDetails?.status === 'Approved' ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                              {app.financingDetails?.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff' }}>
                            ₹{app.financingDetails?.loanAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => handleOpenDecisionModal(app, 'APPROVE', 'calculator')}
                                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              >
                                <Eye size={13} /> Review & Sanction
                              </button>
                              <button
                                onClick={() => handleOpenDecisionModal(app, 'REJECT', 'calculator')}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {loans.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
                            No financing applications pending in queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards List */}
                <div className="mobile-only-card-list">
                  {loans.slice(0, 5).map((app) => renderMobileLoanCard(app))}
                  {loans.length === 0 && (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No financing applications pending in queue.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOANS TABLE */}
          {activeTab === 'loans' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>Green Loan Sanctions Pipeline ({filteredLoans.length})</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Review verified electricity bills, calculate subsidized credit, and approve green financing.</p>
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: `All Loans (${loans.length})` },
                  { key: 'PENDING', label: `Pending Credit Check (${pendingCount})`, color: '#f59e0b' },
                  { key: 'APPROVED', label: `Approved & Disbursed (${approvedCount})`, color: '#10b981' },
                  { key: 'REJECTED', label: `Declined (${rejectedCount})`, color: '#ef4444' },
                ].map((f) => {
                  const isActive = loanFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setLoanFilter(f.key)}
                      style={{
                        background: isActive ? (f.color || '#16a34a') : '#1e293b',
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

              <div className="desktop-only-table" style={{ background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '16px 20px' }}>Reg ID</th>
                      <th style={{ padding: '16px 20px' }}>Applicant & CA</th>
                      <th style={{ padding: '16px 20px' }}>Monthly Bill & Capacity</th>
                      <th style={{ padding: '16px 20px' }}>Loan Status</th>
                      <th style={{ padding: '16px 20px' }}>Sanction Amount</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Credit Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((app) => (
                      <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 700, color: '#f59e0b' }}>{app.registrationId}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{app.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>CA: {app.consumerNo} | 📞 {app.mobile}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{app.districtCity || 'Delhi'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#cbd5e1' }}>Avg Bill: ₹{app.avgMonthlyBill?.toLocaleString('en-IN') || 0}</div>
                          <div style={{ fontSize: '12px', color: '#38bdf8' }}>Est. ~3 kW Rooftop</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div>
                            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: app.financingDetails?.status === 'Approved' ? '#065f4625' : (app.financingDetails?.status === 'Rejected' ? '#ef444425' : '#f59e0b20'), color: app.financingDetails?.status === 'Approved' ? '#34d399' : (app.financingDetails?.status === 'Rejected' ? '#f87171' : '#f59e0b'), fontWeight: 600 }}>
                              {app.financingDetails?.status || 'Pending'}
                            </span>
                            {app.financingDetails?.remarks && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', maxWidth: '200px' }}>
                                {app.financingDetails.remarks}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 700, color: '#fff', fontSize: '15px' }}>
                          ₹{app.financingDetails?.loanAmount?.toLocaleString('en-IN') || '0'}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleOpenDecisionModal(app, 'APPROVE', 'calculator')}
                              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)' }}
                            >
                              <Eye size={14} /> Review & Sanction
                            </button>
                            <button
                              onClick={() => handleOpenDecisionModal(app, 'REJECT', 'calculator')}
                              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <XCircle size={14} /> Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLoans.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No financing applications match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards List */}
              <div className="mobile-only-card-list">
                {filteredLoans.map((app) => renderMobileLoanCard(app))}
                {filteredLoans.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    No financing applications match your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CREDIT GUIDELINES */}
          {activeTab === 'guidelines' && (
            <div style={{ maxWidth: '850px', background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#fff' }}>PM Surya Ghar Green Credit Sanction Criteria</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#4ade80' }}>1. Subsidized Interest Rates:</strong> Collateral-free rooftop solar loans up to ₹2,00,000 are sanctioned at Repo Rate + 0.5% (approx 7.0% per annum).
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#38bdf8' }}>2. DISCOM Bill Verification:</strong> Consumer must possess an active electricity connection with consecutive zero-arrears payment record for the past 6 billing cycles.
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#f59e0b' }}>3. DBT Subsidy Adjustment:</strong> Central Government subsidy (up to ₹78,000 for 3 kW system) is credited directly to the customer bank passbook account and can pre-close part of the loan principal.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', background: '#131b2e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#fff' }}>Green Financer Enterprise Profile</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Financer Entity Name</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{currentUser?.fullName || 'SBI'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Financer Code</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#4ade80', marginTop: '4px' }}>{currentUser?.code || 'FIN-101-01'}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Registered Classification</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>MNRE / IREDA Accredited Lending Desk</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Total Active Portfolio</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>₹{totalSanctionedSum.toLocaleString('en-IN')} Sanctioned</div>
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

      {/* -------------------- COMPREHENSIVE PM SURYA GHAR GREEN CREDIT ASSESSMENT DESK -------------------- */}
      {decisionModalApp && activeCalc && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.88)', 
            backdropFilter: 'blur(6px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 140, 
            padding: '16px' 
          }}
          onClick={() => setDecisionModalApp(null)}
        >
          <div 
            style={{ 
              background: '#0d1527', 
              border: '1px solid rgba(255,255,255,0.15)', 
              borderRadius: '20px', 
              maxWidth: '1080px', 
              width: '100%', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9)', 
              overflow: 'hidden' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#111c35', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)' }}>
                  <Banknote size={24} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(22, 163, 74, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      PM Surya Ghar: Central Green Solar Credit Desk
                    </span>
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        background: decisionModalApp.financingDetails?.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : decisionModalApp.financingDetails?.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: decisionModalApp.financingDetails?.status === 'Approved' ? '#34d399' : decisionModalApp.financingDetails?.status === 'Rejected' ? '#f87171' : '#f59e0b',
                        border: '1px solid ' + (decisionModalApp.financingDetails?.status === 'Approved' ? 'rgba(16, 185, 129, 0.3)' : decisionModalApp.financingDetails?.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)')
                      }}
                    >
                      Loan Status: {decisionModalApp.financingDetails?.status || 'Pending'}
                    </span>
                  </div>
                  <h3 style={{ margin: '4px 0 2px', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                    {decisionModalApp.fullName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span>Reg ID: <strong style={{ color: '#f59e0b' }}>{decisionModalApp.registrationId}</strong></span>
                    <span>•</span>
                    <span>CA No: <strong style={{ color: '#38bdf8' }}>{decisionModalApp.consumerNo}</strong></span>
                    <span>•</span>
                    <span>📞 {decisionModalApp.mobile}</span>
                    <span>•</span>
                    <span>📍 {decisionModalApp.districtCity || 'North Delhi'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDecisionModalApp(null)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Pipeline Stage Tracker */}
            <div style={{ padding: '10px 24px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                <CheckCircle2 size={13} />
                <span><strong>1. Agent Survey:</strong> Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                <CheckCircle2 size={13} />
                <span><strong>2. Distributor Hub:</strong> Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                <CheckCircle2 size={13} />
                <span><strong>3. Partner EPC Feasibility:</strong> {decisionModalApp.partnerDetails?.status || 'Feasible (~3.3 kW)'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: decisionModalApp.financingDetails?.status === 'Approved' ? '#34d399' : '#f59e0b' }}>
                {decisionModalApp.financingDetails?.status === 'Approved' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                <span><strong>4. Credit Sanction:</strong> {decisionModalApp.financingDetails?.status || 'Assessment Desk'}</span>
              </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#090d16', overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setModalTab('calculator')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px 8px 0 0',
                  background: modalTab === 'calculator' ? '#131b2e' : 'transparent',
                  color: modalTab === 'calculator' ? '#4ade80' : '#94a3b8',
                  border: 'none',
                  borderBottom: modalTab === 'calculator' ? '2px solid #4ade80' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Calculator size={15} /> 1. Loan Sizing & Subsidy Calculator
              </button>

              <button
                type="button"
                onClick={() => setModalTab('kyc')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px 8px 0 0',
                  background: modalTab === 'kyc' ? '#131b2e' : 'transparent',
                  color: modalTab === 'kyc' ? '#38bdf8' : '#94a3b8',
                  border: 'none',
                  borderBottom: modalTab === 'kyc' ? '2px solid #38bdf8' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <CreditCard size={15} /> 2. Applicant KYC & Bank Details
              </button>

              <button
                type="button"
                onClick={() => setModalTab('discom')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px 8px 0 0',
                  background: modalTab === 'discom' ? '#131b2e' : 'transparent',
                  color: modalTab === 'discom' ? '#fbbf24' : '#94a3b8',
                  border: 'none',
                  borderBottom: modalTab === 'discom' ? '2px solid #fbbf24' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Zap size={15} /> 3. DISCOM & Technical Feasibility
              </button>

              <button
                type="button"
                onClick={() => setModalTab('documents')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px 8px 0 0',
                  background: modalTab === 'documents' ? '#131b2e' : 'transparent',
                  color: modalTab === 'documents' ? '#a78bfa' : '#94a3b8',
                  border: 'none',
                  borderBottom: modalTab === 'documents' ? '2px solid #a78bfa' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <FolderOpen size={15} /> 4. 10-Point Document Inspection
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* TAB 1: PM SURYA GHAR LOAN CALCULATOR */}
              {modalTab === 'calculator' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Top 4 KPI Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                    <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Recommended Solar Plant</span>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
                        {activeCalc.recommendedKw} kW
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Based on ₹{(decisionModalApp.avgMonthlyBill || 4200).toLocaleString('en-IN')}/mo bill
                      </span>
                    </div>

                    <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Total Benchmark Plant Cost</span>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                        ₹{activeCalc.benchmarkCost.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>IREDA standard benchmark</span>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>Central DBT Subsidy (PM Surya Ghar)</span>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
                        ₹{activeCalc.centralSubsidy.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '11px', color: '#6ee7b7' }}>Credited directly to bank A/C</span>
                    </div>

                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>Net Borrower Loan Outlay</span>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
                        ₹{activeCalc.netPayable.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '11px', color: '#7dd3fc' }}>Cost minus Central Subsidy</span>
                    </div>
                  </div>

                  {/* Interactive Sanction Parameters Box */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {/* Left: Input parameters */}
                      <div>
                        <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Percent size={16} color="#4ade80" /> Credit Sizing & Tenor Controls
                        </h4>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                            Sanction Loan Principal Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={sanctionAmount}
                            onChange={(e) => setSanctionAmount(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', background: '#090d16', border: '1px solid rgba(74, 222, 128, 0.4)', borderRadius: '8px', color: '#4ade80', fontSize: '16px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                          />
                          {/* Quick chip buttons */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setSanctionAmount('75000')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ₹75,000
                            </button>
                            <button
                              type="button"
                              onClick={() => setSanctionAmount('100000')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ₹1,00,000
                            </button>
                            <button
                              type="button"
                              onClick={() => setSanctionAmount('110000')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ₹1,10,000
                            </button>
                            <button
                              type="button"
                              onClick={() => setSanctionAmount(String(activeCalc.netPayable))}
                              style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Net Outlay (₹{activeCalc.netPayable.toLocaleString('en-IN')})
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                            Repayment Tenor
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                            {[3, 5, 7, 10].map((yr) => (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => setTenureYears(yr)}
                                style={{
                                  padding: '8px 4px',
                                  borderRadius: '8px',
                                  background: Number(tenureYears) === yr ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'rgba(255,255,255,0.05)',
                                  border: Number(tenureYears) === yr ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {yr} Yrs ({yr * 12}M)
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                            Interest Rate
                          </label>
                          <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                            7.0% p.a. (Collateral-Free Subsidized Priority Green Lending)
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Monthly EMI & Affordability Box */}
                      <div style={{ background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Estimated Subsidized Monthly EMI</span>
                          <div style={{ fontSize: '32px', fontWeight: 900, color: '#4ade80', margin: '4px 0' }}>
                            ₹{activeCalc.monthlyEmi.toLocaleString('en-IN')} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>/ month</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '14px' }}>
                            Total Interest over {activeCalc.numYears} Yrs: <strong>₹{((activeCalc.monthlyEmi * activeCalc.totalMonths) - activeCalc.principal).toLocaleString('en-IN')}</strong> | Total Repayable: <strong>₹{(activeCalc.monthlyEmi * activeCalc.totalMonths).toLocaleString('en-IN')}</strong>
                          </div>

                          {/* Solar Savings Comparison Strip */}
                          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ color: '#94a3b8' }}>Current Discom Bill:</span>
                              <strong style={{ color: '#f59e0b' }}>₹{(decisionModalApp.avgMonthlyBill || 4200).toLocaleString('en-IN')}/mo</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ color: '#94a3b8' }}>Est. Solar Bill Reduction:</span>
                              <strong style={{ color: '#38bdf8' }}>~₹{activeCalc.estMonthlySolarSavings.toLocaleString('en-IN')}/mo ({activeCalc.estMonthlyGenUnits} kWh)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                              <span style={{ color: '#34d399', fontWeight: 700 }}>Net Monthly Consumer Savings:</span>
                              <strong style={{ color: '#34d399' }}>+₹{Math.max(0, activeCalc.netMonthlyGain).toLocaleString('en-IN')} / mo</strong>
                            </div>
                          </div>
                        </div>

                        {/* DSCR / Feasibility Badge */}
                        <div style={{ padding: '10px 12px', borderRadius: '8px', background: activeCalc.isAffordable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', border: activeCalc.isAffordable ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)', color: activeCalc.isAffordable ? '#34d399' : '#fbbf24', fontSize: '11px', fontWeight: 700 }}>
                          {activeCalc.isAffordable 
                            ? '✅ HIGH CREDIT AFFORDABILITY: Monthly electricity bill savings exceed the loan EMI. Consumer enjoys net-positive cashflow!' 
                            : '⚠️ MODERATE COVERAGE: Loan EMI is close to average power consumption. Recommended 7 to 10 year tenor.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICANT KYC & BANK DETAILS */}
              {modalTab === 'kyc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Applicant Details Card */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', fontWeight: 800 }}>
                      Applicant Personal & Contact Verification
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Applicant Full Name</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.fullName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Primary Mobile Number</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.mobile}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Alternate Mobile</span>
                        <strong style={{ color: '#cbd5e1' }}>{decisionModalApp.alternateNo || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Email Address</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.email || 'consumer@solar.com'}</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Residential & Installation Site Address</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.propertyAddress || decisionModalApp.address || '—'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Government ID & Bureau Checklist */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Aadhaar Identity Proof</span>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>UIDAI VERIFIED</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                        {decisionModalApp.aadhaarNumber || '7829-4455-8910'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Front & Back identity photo verified with OTP audit trail.
                      </div>
                    </div>

                    <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Income Tax PAN Card</span>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ITD ACTIVE</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                        {decisionModalApp.panNumber || 'ABCDE9876K'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        PAN linked with Aadhaar; Name exact match with bank records.
                      </div>
                    </div>

                    <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>CIBIL / Experian Credit Bureau</span>
                        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ELIGIBLE</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                        Score: 742 (Prime Green Risk)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Zero defaults, clean 3-year utility repayment history.
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Particulars (for DBT Subsidy & NACH Auto-Debit) */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.05em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} /> Bank Account & Direct Benefit Transfer (DBT) Cross-Check
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Bank Name & Branch</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.bankDetails?.bankName || 'HDFC Bank, Rohini Sector 15 Branch'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Account Number</span>
                        <strong style={{ color: '#4ade80' }}>{decisionModalApp.bankDetails?.accountNumber || '5010045892314'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>IFSC Code</span>
                        <strong style={{ color: '#38bdf8' }}>{decisionModalApp.bankDetails?.ifscCode || 'HDFC0000123'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Name as per Bank Account</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.bankDetails?.accountHolderName || decisionModalApp.fullName} (Match 100%)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>NPCI Aadhaar Seeding</span>
                        <strong style={{ color: '#34d399' }}>✅ Active (DBT Subsidy Compliant)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>NACH / e-Mandate Status</span>
                        <strong style={{ color: '#38bdf8' }}>Ready for Auto-Debit Activation</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DISCOM & TECHNICAL FEASIBILITY */}
              {modalTab === 'discom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Electricity Connection Card */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.05em', fontWeight: 800 }}>
                      DISCOM Connection & Payment Track Record (Repayment Capacity Evidence)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Electricity Consumer CA No</span>
                        <strong style={{ color: '#fbbf24', fontSize: '15px' }}>{decisionModalApp.consumerNo}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>DISCOM Distribution Company</span>
                        <strong style={{ color: '#fff' }}>Tata Power DDL / BSES Delhi</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Average Monthly Electricity Bill</span>
                        <strong style={{ color: '#38bdf8', fontSize: '15px' }}>₹{(decisionModalApp.avgMonthlyBill || 4200).toLocaleString('en-IN')} / month</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Connection Category & Load</span>
                        <strong style={{ color: '#fff' }}>Domestic LT (Single Phase, 3.0 kW Sanctioned)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Past 6-Month Arrears / Dues</span>
                        <strong style={{ color: '#34d399' }}>₹0.00 (Zero Arrears Verified)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Net Metering Feasibility</span>
                        <strong style={{ color: '#4ade80' }}>Discom Substation Quota Available</strong>
                      </div>
                    </div>
                  </div>

                  {/* Rooftop Feasibility Card */}
                  <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', fontWeight: 800 }}>
                      Rooftop & Physical Site Feasibility (Asset Collateral)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Usable Shadow-Free Roof Area</span>
                        <strong style={{ color: '#34d399', fontSize: '15px' }}>{decisionModalApp.rooftopArea || 480} Sq. Ft</strong>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>(Req for 3.3 kW: ~330 Sq. Ft - Sufficient)</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Roof Construction Type</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.roofType || 'RCC Concrete Slab'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Property Ownership</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.ownership || 'Owned'} ({decisionModalApp.propertyType || 'Residential'})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Land Registry / Khasra Deed</span>
                        <strong style={{ color: '#fff' }}>{decisionModalApp.landDetails || 'Khasra Deed #104/12 Rohini Registry Copy'}</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>GPS Coordinates (Satellite Verification)</span>
                        <strong style={{ color: '#38bdf8' }}>
                          Lat: {decisionModalApp.documents?.rooftopGpsPhoto?.gpsLatitude || '28.7155° N'} | Long: {decisionModalApp.documents?.rooftopGpsPhoto?.gpsLongitude || '77.1292° E'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* EPC Partner Feasibility Notes */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '16px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                        EPC Installation Partner Feasibility Sign-off
                      </span>
                      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        {decisionModalApp.partnerDetails?.partnerName || 'Solarize'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                      "{decisionModalApp.partnerDetails?.feasibilityNotes || 'Site feasible for 3.3 kW rooftop solar installation. RCC shadow-free roof verified. South-facing angle with zero structural obstruction.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: 10-POINT DOCUMENT INSPECTION */}
              {modalTab === 'documents' && (
                <div>
                  <div style={{ marginBottom: '14px', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', color: '#c4b5fd' }}>
                    ℹ️ <strong>Financer Document Audit Desk:</strong> Compare consumer document numbers against live uploaded copies (Aadhaar, PAN, Electricity Bill, Bank Passbook, Land Registry, Rooftop GPS Satellite Image, and Live Camera Photos). Click any document to view full resolution.
                  </div>
                  <DocumentComparisonCards application={decisionModalApp} isReviewer={false} />
                </div>
              )}
            </div>

            {/* Modal Bottom Decision Action Panel */}
            <div style={{ padding: '18px 24px', background: '#111c35', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                {/* Decision Mode Toggle */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionType('APPROVE');
                      setDecisionRemarks('PM Surya Ghar priority green loan sanctioned at 7.0% p.a. Verified DISCOM repayment history and Central DBT subsidy eligibility.');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: decisionType === 'APPROVE' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'rgba(255,255,255,0.05)',
                      border: decisionType === 'APPROVE' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={16} /> Sanction Green Credit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionType('REJECT');
                      setDecisionRemarks('Loan application declined due to credit bureau score below benchmark or electricity bill arrears.');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: decisionType === 'REJECT' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                      border: decisionType === 'REJECT' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={16} /> Decline Financing
                  </button>
                </div>

                {/* Quick Remarks Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {decisionType === 'APPROVE' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDecisionRemarks('PM Surya Ghar green loan approved at 7.0% p.a. DBT subsidy compliant.')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + DBT Compliant
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionRemarks('Sanctioned based on 6-month zero arrears DISCOM bill & CIBIL score 740+.')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + Zero Arrears Track Record
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDecisionRemarks('CIBIL credit score below required NBFC benchmark (minimum 680 required).')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + CIBIL Below 680
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionRemarks('Electricity bill has pending arrears or meter disconnection flag.')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + Discom Arrears Outstanding
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionRemarks('Bank account name mismatch with Aadhaar / PAN card particulars.')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + Bank Name Mismatch
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Remarks Textarea */}
              <div>
                <textarea
                  rows={2}
                  required
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Enter credit audit remarks or sanction memorandum notes..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#090d16',
                    border: '1px solid ' + (decisionType === 'APPROVE' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)'),
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDecisionModalApp(null)}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  Cancel & Close
                </button>

                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={handleConfirmDecision}
                  style={{
                    background: decisionType === 'APPROVE' 
                      ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' 
                      : '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: submittingDecision ? 'not-allowed' : 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: decisionType === 'APPROVE' ? '0 4px 14px rgba(22, 163, 74, 0.4)' : '0 4px 14px rgba(239, 68, 68, 0.4)',
                    opacity: submittingDecision ? 0.7 : 1
                  }}
                >
                  {decisionType === 'APPROVE' ? (
                    <>
                      <CheckCircle2 size={16} /> Confirm Loan Sanction (₹{Number(sanctionAmount || 0).toLocaleString('en-IN')})
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Confirm Loan Application Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
