import React, { useState } from 'react';
import { 
  Sun, Globe, User, LogOut, Menu, X, Shield, 
  ArrowRight, Phone, Sparkles, FileText, CheckCircle2 
} from 'lucide-react';

export default function Navbar({
  lang = 'hi',
  onToggleLang,
  t,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenTrackModal,
  onRegisterClick,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const n = t.nav;

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="navbar-ultra">
      {/* Top micro-announcement ticker (optional, clean) */}
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
          <div className="nav-brand-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/solarconnect-logo-dark.png" 
              alt="SolarConnect - Clean Energy • Brighter Tomorrow" 
              className="navbar-brand-logo-img" 
            />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav-links">
            <button 
              type="button" 
              className="nav-link-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {n.home}
            </button>

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

          {/* Right Controls: Language Switcher + Register Now CTA + Auth */}
          <div className="desktop-actions-wrap">
            {/* Language Switcher Button (English / Hindi Mode) */}
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

            {/* Auth / Profile */}
            {currentUser ? (
              <div className="nav-user-pill">
                <span className="user-initial">{currentUser.fullName?.[0] || 'U'}</span>
                <button 
                  type="button" 
                  className="user-logout-btn" 
                  onClick={onLogout}
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="nav-signin-link"
                onClick={onOpenLogin}
              >
                <User size={15} />
                <span>{n.signIn}</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="mobile-toggle-wrap">
            {/* Quick Lang Switch for Mobile */}
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
          <button 
            type="button" 
            className="mobile-drawer-link"
            onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            {n.home}
          </button>

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
            onClick={() => scrollToSection('connection-register')}
          >
            {n.contact}
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
                <span>Sign Out ({currentUser.fullName || currentUser.email})</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="mobile-signin-btn"
                onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
              >
                <User size={16} />
                <span>{n.signIn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
