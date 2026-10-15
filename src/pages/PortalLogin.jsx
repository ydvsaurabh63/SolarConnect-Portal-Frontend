import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Building,
  Briefcase,
  Users,
  Sun,
  Banknote,
  Wrench,
  UserCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

const roleMeta = {
  superadmin: {
    title: 'Super Admin Portal',
    subtitle: 'National Administration & Master System Control',
    icon: ShieldCheck,
    badge: 'HQ Central Control',
    color: '#4f46e5',
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    targetPath: '/superadmin/dashboard',
  },
  admin: {
    title: 'State Operations Admin Portal',
    subtitle: 'Regional Applications, Distributor Network & EPC Allocation',
    icon: Building,
    badge: 'Operations Desk',
    color: '#0284c7',
    bgGradient: 'linear-gradient(135deg, #082f49 0%, #0369a1 100%)',
    targetPath: '/admin/dashboard',
  },
  distributor: {
    title: 'Solar Distributor Portal',
    subtitle: 'Area Franchise, Agency Management & Field Agents',
    icon: Briefcase,
    badge: 'Distributor Hub',
    color: '#d97706',
    bgGradient: 'linear-gradient(135deg, #451a03 0%, #b45309 100%)',
    targetPath: '/distributor/dashboard',
  },
  agent: {
    title: 'Field Agent / Executive Portal',
    subtitle: 'On-Ground Consumer Registration & Instant ID Generation',
    icon: Users,
    badge: 'Field Survey Team',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
    targetPath: '/agent/dashboard',
  },
  partner: {
    title: 'EPC Partner / Service Provider',
    subtitle: 'Technical Feasibility, Equipment Sizing & Installer Allocation',
    icon: Sun,
    badge: 'EPC Operations',
    color: '#0891b2',
    bgGradient: 'linear-gradient(135deg, #164e63 0%, #0e7490 100%)',
    targetPath: '/partner/dashboard',
  },
  financer: {
    title: 'Green Renewable Finance Portal',
    subtitle: 'PM Surya Ghar Solar Loans, Credit Verification & Approvals',
    icon: Banknote,
    badge: 'Financing Desk',
    color: '#16a34a',
    bgGradient: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)',
    targetPath: '/financer/dashboard',
  },
  installer: {
    title: 'Certified Installer Portal',
    subtitle: 'Assigned Work Orders, Site GPS & Installation Proofs',
    icon: Wrench,
    badge: 'Technical Field Team',
    color: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 100%)',
    targetPath: '/installer/dashboard',
  },
  user: {
    title: 'Consumer / Applicant Portal',
    subtitle: 'PM Surya Ghar: Track Live Status, Subsidy & Installer Contact',
    icon: UserCheck,
    badge: 'Beneficiary Portal',
    color: '#eab308',
    bgGradient: 'linear-gradient(135deg, #422006 0%, #854d0e 100%)',
    targetPath: '/user/dashboard',
  },
};

export default function PortalLogin({ fixedRole = null }) {
  const params = useParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const roleKey = fixedRole || params.role || 'user';
  const meta = roleMeta[roleKey] || roleMeta.user;
  const RoleIcon = meta.icon;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your email, mobile, or ID.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login(identifier, password, roleKey === 'user' ? null : roleKey);
      if (res.success && res.user) {
        loginUser(res.user);
        const path =
          roleKey === 'user' || res.user.role === 'user'
            ? '/user/dashboard'
            : `/${res.user.role}/dashboard`;
        navigate(path);
      } else {
        setErrorMsg(res.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: meta.color,
          filter: 'blur(160px)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />



      {/* Brand Logo */}
      <Link to="/" style={{ textDecoration: 'none', marginBottom: '24px', zIndex: 10 }}>
        <img 
          src="/logo.png" 
          alt="SolarConnect" 
          style={{ height: '52px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} 
        />
      </Link>

      {/* Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: meta.bgGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: `0 10px 25px -5px ${meta.color}40`,
              color: '#fff',
            }}
          >
            <RoleIcon size={32} />
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#f8fafc',
              margin: '0 0 6px',
            }}
          >
            {meta.title}
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {meta.subtitle}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}
            >
              {roleKey === 'user' ? 'Consumer ID / Mobile / Email' : 'Email Address'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={roleKey === 'user' ? 'e.g. CA-10293847 or Mobile' : 'Enter your registered email'}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: meta.color,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: `0 8px 20px -4px ${meta.color}50`,
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
