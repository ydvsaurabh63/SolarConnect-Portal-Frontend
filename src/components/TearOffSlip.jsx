import React from 'react';
import { Printer, CheckCircle2, Sun, ShieldCheck, Download, X, ArrowLeft } from 'lucide-react';

export default function TearOffSlip({ registration, onClose, onPrint }) {
  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tear-off-slip-wrapper animate-fade-in">
      <div className="tear-off-card" id="printable-tear-off-slip">
        {/* Top Header */}
        <div className="slip-header">
          <div className="slip-brand">
            <div className="slip-emblem">
              <Sun size={28} className="text-solar" />
            </div>
            <div>
              <span className="slip-scheme-title">PM SURYA GHAR: MUFT BIJLI YOJANA</span>
              <h2 className="slip-title">Applicant Tear-Off Acknowledgement Slip</h2>
              <span className="slip-sub">SolarConnect Field Registration Record</span>
            </div>
          </div>
          <div className="slip-id-box">
            <span className="slip-id-label">REGISTRATION ID</span>
            <span className="slip-id-value">{registration.registrationId}</span>
          </div>
        </div>

        {/* Perforated Divider line */}
        <div className="slip-perforation">
          <span className="cut-here-label">✂ TEAR-OFF HERE (APPLICANT COPY) ✂</span>
        </div>

        {/* Slip Body Content */}
        <div className="slip-body-grid">
          <div className="slip-col">
            <div className="slip-field">
              <span className="sf-label">Applicant Full Name:</span>
              <strong className="sf-value">{registration.fullName}</strong>
            </div>
            <div className="slip-field">
              <span className="sf-label">Registered Mobile:</span>
              <strong className="sf-value">{registration.mobile}</strong>
            </div>
            <div className="slip-field">
              <span className="sf-label">Bijli Bill / Consumer No:</span>
              <strong className="sf-value font-mono">{registration.consumerNo}</strong>
            </div>
            <div className="slip-field">
              <span className="sf-label">Average Monthly Bill:</span>
              <strong className="sf-value">₹{Number(registration.avgMonthlyBill).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="slip-col">
            <div className="slip-field">
              <span className="sf-label">Registration Date:</span>
              <strong className="sf-value">
                {new Date(registration.createdAt || registration.issuedOn || Date.now()).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
            <div className="slip-field">
              <span className="sf-label">District / Area:</span>
              <strong className="sf-value">{registration.districtCity || registration.areaDistrict}</strong>
            </div>
            <div className="slip-field">
              <span className="sf-label">Field Executive / Mode:</span>
              <strong className="sf-value">{registration.executiveName} ({registration.executiveId || 'N/A'})</strong>
            </div>
            <div className="slip-field">
              <span className="sf-label">Office Verification:</span>
              <span className={`status-pill status-${registration.verification?.status?.toLowerCase() || 'pending'}`}>
                {registration.verification?.status || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="slip-address-full">
          <span className="sf-label">Installation Property Address:</span>
          <p className="sf-address-text">{registration.propertyAddress || registration.address}</p>
        </div>

        {/* Important Statutory Notice matching booklet */}
        <div className="slip-notice-box">
          <ShieldCheck size={20} className="notice-icon" />
          <div className="notice-text">
            <strong>Important Field Instructions & Disclaimers:</strong>
            <ul>
              <li>• Registration is strictly an <strong>Expression of Interest</strong> under PM Surya Ghar: Muft Bijli Yojana.</li>
              <li>• <strong>NO CASH OR PAYMENT</strong> is to be handed over to any field executive during registration.</li>
              <li>• Central Government DBT subsidy (up to ₹78,000) is credited directly into bank account post-inspection & net-metering.</li>
              <li>• Our technical desk will contact you within 48-72 hours for rooftop feasibility assessment.</li>
            </ul>
          </div>
        </div>

        {/* Signatures & Seal Box */}
        <div className="slip-signatures-row">
          <div className="sig-block">
            <div className="sig-line">
              {registration.applicantSignature ? (
                <span className="sig-captured">✓ Signature Captured Digitally</span>
              ) : (
                <span className="sig-signed-placeholder">{registration.fullName}</span>
              )}
            </div>
            <span className="sig-caption">Applicant Signature / Acknowledgement</span>
          </div>

          <div className="sig-block">
            <div className="sig-line">
              <span className="sig-captured">✓ Verified by {registration.executiveName}</span>
            </div>
            <span className="sig-caption">Field Executive Signature & ID</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="slip-actions-bar">
        <button className="slip-btn-print" onClick={handlePrint}>
          <Printer size={18} />
          <span>Print / Save as PDF</span>
        </button>
        {onClose && (
          <button className="slip-btn-back" onClick={onClose}>
            <ArrowLeft size={18} />
            <span>Back to Portal</span>
          </button>
        )}
      </div>
    </div>
  );
}
