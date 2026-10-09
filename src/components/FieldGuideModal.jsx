import React from 'react';
import { X, CheckCircle2, AlertTriangle, PhoneCall, Camera, FileText, PenTool, Send, ShieldAlert, Award } from 'lucide-react';

export default function FieldGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const steps = [
    {
      num: 'Step 1: MEET',
      title: 'Introduce Scheme & Zero Payment Policy',
      desc: 'Explain that the registration is strictly an Expression of Interest under PM Surya Ghar: Muft Bijli Yojana and that NO PAYMENT or cash is collected.',
      icon: <Award size={22} className="text-emerald" />,
    },
    {
      num: 'Step 2: FILL',
      title: 'Complete Registration Details',
      desc: 'Capture full applicant details, mobile number, property type, ownership, consumer number, and average monthly bill.',
      icon: <FileText size={22} className="text-blue" />,
    },
    {
      num: 'Step 3: COLLECT',
      title: 'Document Checklist Verification',
      desc: 'Collect readable photos of: 1. Aadhaar Card, 2. PAN Card, 3. Electricity Bill, 4. Bank Passbook, 5. Land/Property Receipt.',
      icon: <CheckCircle2 size={22} className="text-emerald" />,
    },
    {
      num: 'Step 4: ROOFTOP',
      title: 'Capture Rooftop Photo (GPS Camera ON)',
      desc: 'Instruct GPS Camera ON. Photos must be flat, bright, fully inside the frame, clearly showing open terrace, roof condition, and surrounding shadows.',
      icon: <Camera size={22} className="text-amber" />,
    },
    {
      num: 'Step 5: SIGN',
      title: 'Signatures & Slip Handover',
      desc: 'Applicant signs declaration. Field Executive signs acknowledgement. Digital/Printed tear-off slip is handed over to the candidate.',
      icon: <PenTool size={22} className="text-blue" />,
    },
    {
      num: 'Step 6: SUBMIT',
      title: 'Submit & Log into Submission Log',
      desc: 'Send form and photos to central database. The submission is immediately cataloged in the digital Submission Log for Office Verification.',
      icon: <Send size={22} className="text-emerald" />,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <span className="badge-chip text-emerald">
            <Award size={14} /> OFFICIAL FIELD EXECUTIVE HANDBOOK
          </span>
          <h2 className="modal-title">Field Guide Workflow (6 Steps)</h2>
          <p className="modal-subtitle">
            Standard operating procedure for registering interested candidates under PM Surya Ghar: Muft Bijli Yojana.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="guide-steps-grid">
          {steps.map((st, i) => (
            <div key={i} className="guide-step-card">
              <div className="guide-step-header">
                <div className="guide-step-icon">{st.icon}</div>
                <span className="guide-step-num">{st.num}</span>
              </div>
              <h4 className="guide-step-title">{st.title}</h4>
              <p className="guide-step-desc">{st.desc}</p>
            </div>
          ))}
        </div>

        {/* 4 Cardinal Golden Rules from Booklet */}
        <div className="cardinal-rules-box">
          <div className="rules-header">
            <ShieldAlert size={20} className="text-amber" />
            <h4>4 Strict Field Rules (Do Not Violate)</h4>
          </div>
          <div className="rules-grid">
            <div className="rule-item">
              <PhoneCall size={16} className="text-emerald" />
              <span><strong>Verify Mobile Number:</strong> Call the candidate mobile once on the spot to verify it rings.</span>
            </div>
            <div className="rule-item">
              <AlertTriangle size={16} className="text-amber" />
              <span><strong>Do Not Promise Approval:</strong> Never promise guaranteed subsidy amount or final price upfront.</span>
            </div>
            <div className="rule-item">
              <AlertTriangle size={16} className="text-red" />
              <span><strong>Zero Cash Acceptance:</strong> Strictly do not take any cash, fee, or registration token money.</span>
            </div>
            <div className="rule-item">
              <CheckCircle2 size={16} className="text-blue" />
              <span><strong>Never Retain Originals:</strong> Only photograph documents; always return original papers immediately.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button className="submit-btn" onClick={onClose}>I Understand & Will Comply</button>
        </div>
      </div>
    </div>
  );
}
