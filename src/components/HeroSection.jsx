import React, { useState } from 'react';
import { 
  Sun, Zap, ArrowRight, MessageCircle, Sparkles, 
  ShieldCheck, CheckCircle2, TrendingDown, IndianRupee,
  Home, Calculator
} from 'lucide-react';

export default function HeroSection({ 
  lang = 'hi', 
  t, 
  onRegisterClick, 
  onScrollToCalc 
}) {
  const h = t.hero;

  // 3D tilt coordinates on mouse move
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleWhatsAppClick = () => {
    const phone = '919876543210';
    const text = encodeURIComponent(
      lang === 'hi'
        ? 'नमस्ते SolarConnect! मुझे अपने घर के लिए सोलर कनेक्शन की जानकारी चाहिए।'
        : 'Hello SolarConnect! I would like to get solar rooftop connection details for my home.'
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <section className="solar-hero-ultra">
      {/* Dynamic 3D ambient glows */}
      <div className="ultra-glow glow-sun" aria-hidden="true" />
      <div className="ultra-glow glow-emerald" aria-hidden="true" />

      <div className="section-container">
        <div className="hero-ultra-grid">
          {/* Left Column: Bold, Minimal, Punchy Headlines */}
          <div className="hero-text-col">
            {/* Top Scheme Badge with live pulse */}
            <div className="hero-top-badge animate-fade-in">
              <span className="badge-pulse-dot" />
              <Sun size={16} className="text-solar-gold spin-slow" />
              <span className="badge-text">{h.schemePill}</span>
            </div>

            {/* Giant Punchy Title */}
            <h1 className="hero-giant-title">
              <span className="block-line line-dark">{h.mainTitlePart1}</span>
              <span className="block-line line-highlight">
                {h.mainTitlePart2}
              </span>
            </h1>

            {/* Concise Subtitle (Minimal Text) */}
            <p className="hero-clean-subtitle">
              {h.subTitle}
            </p>

            {/* 3 Quick Visual Benefit Chips */}
            <div className="hero-chips-row">
              {h.chips.map((chip, i) => (
                <div key={i} className="hero-chip-pill">
                  <span className="chip-check">✓</span>
                  <span className="chip-title">{chip.text}</span>
                </div>
              ))}
            </div>

            {/* Big Action Buttons */}
            <div className="hero-cta-buttons">
              <button 
                type="button" 
                className="hero-btn-register"
                onClick={onRegisterClick}
                id="hero-register-btn"
              >
                <span>{h.btnRegister}</span>
                <ArrowRight size={20} className="btn-arrow" />
              </button>

              <button 
                type="button" 
                className="hero-btn-whatsapp"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle size={20} className="text-emerald" />
                <span>{h.btnWhatsapp}</span>
              </button>
            </div>

            {/* Mini Trust Bar */}
            <div className="hero-mini-trust">
              <div className="trust-item">
                <IndianRupee size={16} className="text-solar-gold" />
                <span>{lang === 'hi' ? '₹78,000 केंद्र + ₹20,000 राज्य सब्सिडी' : '₹78,000 Central + ₹20,000 State Subsidy'}</span>
              </div>
              <div className="trust-divider">•</div>
              <div className="trust-item">
                <ShieldCheck size={16} className="text-emerald" />
                <span>{lang === 'hi' ? '25 साल वारंटी' : '25 Yrs Warranty'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Perspective Photo Card */}
          <div className="hero-photo-col">
            <div 
              className="hero-3d-photo-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              }}
            >
              {/* Main Family House Image */}
              <div className="hero-photo-frame">
                <img 
                  src="/solar-family.jpg" 
                  alt="Happy Indian Family with Solar Rooftop" 
                  className="hero-main-photo"
                  loading="eager"
                />

                {/* Floating 3D Badge 1: Top Right */}
                <div className="floating-badge badge-top-ribbon">
                  <Sun size={16} className="text-solar-gold" />
                  <span className="badge-ribbon-text">{h.imgBadgeTop}</span>
                </div>

                {/* Floating 3D Badge 2: Bottom Overlay */}
                <div className="floating-badge badge-bottom-card">
                  <div className="fbc-icon-wrap">
                    <Zap size={18} className="text-solar-gold" />
                  </div>
                  <div className="fbc-content">
                    <span className="fbc-main">{h.imgBadgeBottom}</span>
                    <span className="fbc-sub">{h.subsidyChip}</span>
                  </div>
                </div>

                {/* Shimmer light bar across frame */}
                <div className="photo-shine" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
