import React from 'react';
import { Sun, Leaf, Sparkles, HeartHandshake, ShieldCheck, Phone, Mail, ArrowUp } from 'lucide-react';

export default function Footer({ lang = 'hi', t }) {
  const f = t.footer;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-ultra">
      <div className="section-container">
        {/* Top Ribbon with Slogan */}
        <div className="footer-top-ribbon">
          <div className="footer-brand-title" onClick={scrollToTop}>
            <img 
              src="/solarconnect-logo-dark.png" 
              alt="SolarConnect - Clean Energy • Brighter Tomorrow" 
              className="footer-brand-logo-img" 
            />
          </div>

          <div className="footer-motto-wrap">
            <span className="footer-motto">{f.quote}</span>
          </div>

          <div className="footer-back-top">
            <button 
              type="button" 
              className="back-top-btn" 
              onClick={scrollToTop}
              title="Back to Top"
            >
              <ArrowUp size={16} />
              <span>Top</span>
            </button>
          </div>
        </div>

        {/* 3 Pillars Tags (Matching reference image) */}
        <div className="footer-pillars-row">
          <div className="pillar-item">
            <Leaf size={16} className="text-emerald" />
            <span>{f.tags[0]}</span>
          </div>
          <div className="pillar-divider">•</div>
          <div className="pillar-item">
            <Sparkles size={16} className="text-solar-gold" />
            <span>{f.tags[1]}</span>
          </div>
          <div className="pillar-divider">•</div>
          <div className="pillar-item">
            <HeartHandshake size={16} className="text-blue" />
            <span>{f.tags[2]}</span>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="footer-sub-bar">
          <p className="footer-rights">
            © {new Date().getFullYear()} {f.rights}
          </p>
          <div className="footer-admin-link-wrap">
            <a 
              href="http://localhost:5175" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-admin-badge"
            >
              <ShieldCheck size={14} />
              <span>Admin Portal Login</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
