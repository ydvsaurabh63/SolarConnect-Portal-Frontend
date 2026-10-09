import React from 'react';
import { Landmark, Trees, Coins, Plus, Equal, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SchemeFormulaSection({ lang = 'hi', t, onRegisterClick }) {
  const s = t.scheme;

  return (
    <section id="govt-scheme" className="scheme-formula-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="scheme-sec-header text-center">
          <div className="scheme-badge-pill">
            <Sparkles size={14} className="text-solar-gold" />
            <span>{lang === 'hi' ? 'द्वि-स्तरीय सरकारी सब्सिडी' : 'Dual-Tier Govt Subsidy'}</span>
          </div>
          <h2 className="scheme-title">{s.title}</h2>
          <p className="scheme-subtitle">{s.subtitle}</p>
        </div>

        {/* 3D Formula Cards Row */}
        <div className="scheme-formula-row">
          {/* Box 1: Central Govt */}
          <div className="scheme-3d-card central-card">
            <div className="s3d-icon-circle blue">
              <Landmark size={28} />
            </div>
            <div className="s3d-content">
              <span className="s3d-scheme-tag">{s.box1.scheme}</span>
              <div className="s3d-amount-val">{s.box1.amount}</div>
              <p className="s3d-source-text">{s.box1.source}</p>
            </div>
            <div className="s3d-pill-footer">
              <CheckCircle2 size={13} />
              <span>{lang === 'hi' ? 'केंद्रीय डीबीटी' : 'Direct DBT'}</span>
            </div>
          </div>

          {/* Plus Sign */}
          <div className="scheme-math-operator plus-op">
            <Plus size={26} />
          </div>

          {/* Box 2: State Govt */}
          <div className="scheme-3d-card state-card">
            <div className="s3d-icon-circle orange">
              <Trees size={28} />
            </div>
            <div className="s3d-content">
              <span className="s3d-scheme-tag">{s.box2.scheme}</span>
              <div className="s3d-amount-val">{s.box2.amount}</div>
              <p className="s3d-source-text">{s.box2.source}</p>
            </div>
            <div className="s3d-pill-footer">
              <CheckCircle2 size={13} />
              <span>{lang === 'hi' ? 'राज्य प्रोत्साहन' : 'State Subsidy'}</span>
            </div>
          </div>

          {/* Equal Sign */}
          <div className="scheme-math-operator equal-op">
            <Equal size={26} />
          </div>

          {/* Box 3: Total Highlighted Benefit */}
          <div className="scheme-3d-card total-card highlighted">
            <div className="s3d-glow-ring" aria-hidden="true" />
            <div className="s3d-icon-circle gold">
              <Coins size={28} />
            </div>
            <div className="s3d-content">
              <span className="s3d-scheme-tag highlight">{s.box3.scheme}</span>
              <div className="s3d-amount-val gold-gradient">{s.box3.amount}</div>
              <p className="s3d-source-text">{s.box3.source}</p>
            </div>
            <button 
              type="button" 
              className="s3d-action-btn"
              onClick={onRegisterClick}
            >
              <span>{lang === 'hi' ? 'सब्सिडी क्लेम करें' : 'Claim Subsidy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
