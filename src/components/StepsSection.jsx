import React from 'react';
import { FileEdit, HardHat, SunMedium, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function StepsSection({ lang = 'hi', t, onRegisterClick }) {
  const s = t.steps;

  const stepIcons = [FileEdit, HardHat, SunMedium];
  const stepColors = ['step-orange', 'step-blue', 'step-green'];

  return (
    <section id="process" className="steps-flow-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="steps-header text-center">
          <div className="steps-tag">
            <Sparkles size={14} className="text-solar-gold" />
            <span>{lang === 'hi' ? '3 आसान चरण' : '3 Easy Steps'}</span>
          </div>
          <h2 className="steps-title">{s.title}</h2>
          <p className="steps-subtitle">{s.subtitle}</p>
        </div>

        {/* 3 Step Flow Row */}
        <div className="steps-flow-row">
          {s.items.map((item, index) => {
            const Icon = stepIcons[index] || FileEdit;
            const colorClass = stepColors[index] || 'step-orange';

            return (
              <React.Fragment key={item.step}>
                <div 
                  className={`step-flow-card ${colorClass}`}
                  onClick={onRegisterClick}
                >
                  {/* Step Number Badge */}
                  <div className="step-num-badge">
                    <span>{item.step}</span>
                  </div>

                  {/* Step Icon */}
                  <div className="step-icon-circle">
                    <Icon size={32} />
                  </div>

                  {/* Step Details */}
                  <h3 className="step-name">{item.title}</h3>
                  <p className="step-desc">{item.desc}</p>

                  <div className="step-pill">
                    <CheckCircle2 size={13} />
                    <span>{item.badge}</span>
                  </div>
                </div>

                {/* Animated Arrow Connector between steps */}
                {index < s.items.length - 1 && (
                  <div className="step-connector-arrow">
                    <div className="arrow-pulse-line">
                      <span className="arrow-dot"></span>
                    </div>
                    <ArrowRight size={22} className="arrow-icon" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
