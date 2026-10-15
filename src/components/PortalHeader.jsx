import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, LogOut, Home, User, Shield, ExternalLink, XCircle } from 'lucide-react';

export default function PortalHeader({ title, roleBadge, badgeColor = '#3b82f6' }) {
  const { currentUser, logoutUser, loginUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Smart Logout: return to the login page of the current portal role
    const currentRole = currentUser?.role === 'user' ? 'user' : (currentUser?.role || 'user');
    logoutUser();
    navigate(`/${currentRole}/login`);
  };

  const handleEndImpersonation = () => {
    // If opened in a new tab, window.close() can be called or revert to impersonator
    if (window.opener && !window.opener.closed) {
      window.close();
    } else {
      const parentRole = currentUser?.impersonatedBy || 'superadmin';
      navigate(`/${parentRole}/dashboard`);
    }
  };

  return (
    <>
      {/* Impersonation Indicator Banner if logged in via Super Admin or Parent */}
      {currentUser?.isImpersonated && (
        <div
          style={{
            background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
            color: '#fff',
            padding: '8px 24px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👁️ <strong>IMPERSONATION SESSION:</strong> You are viewing this portal as <strong>{currentUser.fullName}</strong> ({currentUser.role.toUpperCase()}), opened by {currentUser.impersonatedBy.toUpperCase()}.</span>
          </div>
          <button
            onClick={handleEndImpersonation}
            style={{
              background: '#00000040',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <XCircle size={14} /> Close Session / Tab
          </button>
        </div>
      )}

      <header
        style={{
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1350px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <img src="/logo.png" alt="SolarConnect" style={{ height: '34px', objectFit: 'contain' }} />
            </Link>
            <span
              style={{
                fontSize: '12px',
                background: `${badgeColor}20`,
                color: badgeColor,
                border: `1px solid ${badgeColor}40`,
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {roleBadge}
            </span>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500, display: 'none', md: 'inline' }}>
              | {title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {currentUser?.fullName || 'Logged In User'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {currentUser?.companyName || currentUser?.territory || currentUser?.email}
              </div>
            </div>

            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              <Home size={15} /> Website
            </Link>

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
              title="Logout and return to portal login"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
