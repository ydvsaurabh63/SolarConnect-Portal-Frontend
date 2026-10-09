import React from 'react';
import { PiggyBank, Leaf, ShieldCheck, TrendingUp, Users, Sparkles } from 'lucide-react';

export default function BenefitsSection({ lang = 'hi', t, onRegisterClick }) {
  const b = t.benefits;

  const iconMap = {
    savings: { icon: PiggyBank, color: 'pink-rose' },
    clean: { icon: Leaf, color: 'emerald' },
    warranty: { icon: ShieldCheck, color: 'teal' },
    property: { icon: TrendingUp, color: 'amber' },
    family: { icon: Users, color: 'cyan' },
  };

  return (
    <section id="why-solar" className="benefits-3d-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="benefits-sec-header text-center">
          <div className="benefits-pill-tag">
            <Sparkles size={14} className="text-solar-gold" />
            <span>{lang === 'hi' ? 'सोलर एडवांटेज' : 'The Solar Advantage'}</span>
          </div>
          <h2 className="benefits-title">{b.title}</h2>
          <p className="benefits-subtitle">{b.subtitle}</p>
        </div>

        {/* 5 3D Isometric / Motion Cards Grid */}
        <div className="benefits-cards-grid">
          {b.cards.map((card, idx) => {
            const IconObj = iconMap[card.id] || { icon: Sparkles, color: 'emerald' };
            const Icon = IconObj.icon;

            return (
              <div 
                key={card.id} 
                className="benefit-3d-card"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={onRegisterClick}
              >
                <div className="b3d-badge">{card.badge}</div>

                <div className={`b3d-icon-cube ${IconObj.color}`}>
                  <Icon size={32} />
                </div>

                <h3 className="b3d-card-title">{card.title}</h3>
                <p className="b3d-card-desc">{card.desc}</p>

                <div className="b3d-bottom-glow" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
