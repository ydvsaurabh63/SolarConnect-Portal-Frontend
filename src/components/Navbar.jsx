import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, Globe, User, LogOut, Menu, X, Shield, 
  ArrowRight, Phone
} from 'lucide-react';

export default function Navbar({
  lang = 'hi',
  onToggleLang,
  t,
  currentUser,
  onLogout,
  onOpenTrackModal,
  onRegisterClick,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const n = t?.nav || {
    home: 'Home',
    whySolar: 'Why Solar',
    govtScheme: 'Govt Scheme',
    process: 'Process',
    contact: 'Contact',
    trackStatus: 'Track Status',
    registerNow: 'Apply Now',
    signIn: 'Customer Login',
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="navbar-ultra">
      {/* Top micro-announcement ticker */}
      <div className="navbar-top-bar">
        <div className="section-container top-bar-flex">
          <div className="top-bar-left">
            <span className="live-dot" />
            <span className="top-bar-scheme">
              {lang === 'hi' 
                ? 'पीएम सूर्य घर मुफ्त बिजली योजना — ₹78,000 + ₹20,000 सरकारी सब्सिडी उपलब्ध' 
                : 'PM Surya Ghar Muft Bijli Yojana — Up to ₹98,000 Combined Govt Subsidy Available'}
            </span>
          </div>
          <div className="top-bar-right">
            <a href="tel:18008907652" className="top-phone-link">
              <Phone size={13} />
              <span>1800-890-SOLAR (Toll-Free)</span>
            </a>
          </div>
        </div>
      </div>

      <div className="nav-main-container">
        <div className="nav-flex">
          {/* Brand Logo */}
          <Link to="/" className="nav-brand-wrap" style={{ textDecoration: 'none' }}>
            <img 
              src="/solarconnect-logo-dark.png" 
              alt="SolarConnect - Clean Energy • Brighter Tomorrow" 
              className="navbar-brand-logo-img" 
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav-links">
            <Link 
              to="/" 
              className="nav-link-btn"
              style={{ textDecoration: 'none' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {n.home}
            </Link>

            <button 
              type="button" 
              className="nav-link-btn"
              onClick={() => scrollToSection('why-solar')}
            >
              {n.whySolar}
            </button>

            <button 
              type="button" 
              className="nav-link-btn"
              onClick={() => scrollToSection('govt-scheme')}
            >
              {n.govtScheme}
            </button>

            <button 
              type="button" 
              className="nav-link-btn"
              onClick={() => scrollToSection('process')}
            >
              {n.process}
            </button>

            <button 
              type="button" 
              className="nav-link-btn"
              onClick={() => scrollToSection('connection-register')}
            >
              {n.contact}
            </button>

            <button 
              type="button" 
              className="nav-link-btn track-highlight-btn"
              onClick={onOpenTrackModal}
            >
              <Shield size={14} />
              <span>{n.trackStatus}</span>
            </button>
          </nav>

          {/* Right Controls: Language Switcher + Register Now CTA + Customer Auth */}
          <div className="desktop-actions-wrap">
            {/* Language Switcher */}
            <button 
              type="button" 
              className="lang-switcher-pill"
              onClick={onToggleLang}
              title={lang === 'hi' ? 'Switch to English' : 'Switch to Hindi'}
            >
              <Globe size={15} className="lang-globe-icon" />
              <span className="lang-pill-text">
                {lang === 'hi' ? 'English' : '🇮🇳 हिन्दी'}
              </span>
            </button>

            {/* Prominent Golden Register Now Button */}
            <button 
              type="button" 
              className="nav-btn-register"
              onClick={onRegisterClick}
            >
              <span>{n.registerNow}</span>
              <ArrowRight size={16} />
            </button>

            {/* Auth / Profile Link */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  to={currentUser.role === 'user' ? '/user/dashboard' : `/${currentUser.role}/dashboard`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f59e0b20',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b50',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <User size={15} /> My Portal ({currentUser.fullName?.split(' ')[0]})
                </Link>
                <button 
                  type="button" 
                  className="user-logout-btn" 
                  onClick={onLogout}
                  title="Sign Out"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link 
                to="/user/login"
                className="nav-signin-link"
                style={{ textDecoration: 'none' }}
              >
                <User size={15} />
                <span>Customer Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="mobile-toggle-wrap">
            <button 
              type="button" 
              className="mobile-lang-btn"
              onClick={onToggleLang}
            >
              {lang === 'hi' ? 'EN' : 'हिन्दी'}
            </button>

            <button 
              type="button" 
              className="mobile-menu-burger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <Link 
            to="/" 
            className="mobile-drawer-link"
            style={{ textDecoration: 'none' }}
            onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            {n.home}
          </Link>

          <button 
            type="button" 
            className="mobile-drawer-link"
            onClick={() => scrollToSection('why-solar')}
          >
            {n.whySolar}
          </button>

          <button 
            type="button" 
            className="mobile-drawer-link"
            onClick={() => scrollToSection('govt-scheme')}
          >
            {n.govtScheme}
          </button>

          <button 
            type="button" 
            className="mobile-drawer-link"
            onClick={() => scrollToSection('process')}
          >
            {n.process}
          </button>

          <button 
            type="button" 
            className="mobile-drawer-link"
            onClick={() => { setMobileMenuOpen(false); onOpenTrackModal(); }}
          >
            <Shield size={16} />
            <span>{n.trackStatus}</span>
          </button>

          <div className="mobile-drawer-actions">
            <button 
              type="button" 
              className="mobile-reg-cta"
              onClick={() => { setMobileMenuOpen(false); onRegisterClick(); }}
            >
              <span>{n.registerNow}</span>
              <ArrowRight size={18} />
            </button>

            {currentUser ? (
              <button 
                type="button" 
                className="mobile-signout-btn"
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
              >
                <LogOut size={16} />
                <span>Sign Out ({currentUser.fullName})</span>
              </button>
            ) : (
              <Link 
                to="/user/login"
                className="mobile-signin-btn"
                style={{ textDecoration: 'none', textAlign: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={16} />
                <span>Customer Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
