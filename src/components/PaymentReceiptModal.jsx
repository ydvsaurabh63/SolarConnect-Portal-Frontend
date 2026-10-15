import React, { useState } from 'react';
import { 
  CheckCircle2, Printer, X, Download, ShieldCheck, 
  CreditCard, MapPin, User, Building, ExternalLink,
  Copy, Key, FileText, ArrowRight
} from 'lucide-react';

export default function PaymentReceiptModal({ application, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeImgZoom, setActiveImgZoom] = useState(false);

  if (!application) return null;

  const payment = application.paymentDetails || {};
  const feeAmount = payment.amount || 500;
  const payMode = payment.mode || 'UPI Online';
  const txnId = payment.transactionId || 'UPI-REF-RECEIVED';
  const receiptNo = payment.receiptNumber || `REC-${application.registrationId || 'SC-001'}`;
  const receiptDate = payment.paymentDate 
    ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Calculate consumer credentials:
  // Login ID = User's Email
  // Password = <FirstName>@<Last4DigitsOfMobile>
  const rawFirst = (application.fullName || 'User').trim().split(/\s+/)[0];
  const userFirstName = rawFirst ? (rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()) : 'User';
  const cleanMob = String(application.mobile || '').replace(/\D/g, '');
  const last4Mob = cleanMob.slice(-4) || '1234';
  const expectedPass = `${userFirstName}@${last4Mob}`;

  const loginId = application.consumerAccount?.email || application.email || application.consumerAccount?.loginId || (cleanMob ? `${cleanMob}@solar.com` : application.consumerNo);
  const loginPass = (application.consumerAccount?.tempPassword && !application.consumerAccount.tempPassword.startsWith('Solar@') && !application.consumerAccount.tempPassword.startsWith('solar@') && application.consumerAccount.tempPassword !== 'user123') 
    ? application.consumerAccount.tempPassword 
    : expectedPass;
  const screenshotUrl = payment.paymentScreenshotUrl || '';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCredentials = () => {
    const credText = `SolarConnect Consumer Portal Login:\nWebsite: ${window.location.origin}/consumer/login\nLogin ID (Email): ${loginId}\nPassword: ${loginPass}\nConsumer CA No: ${application.consumerNo || '—'}\nApplication Reg ID: ${application.registrationId}`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="receipt-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="receipt-printable-container"
        style={{
          background: '#0a0f1d',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '20px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div 
          className="no-print"
          style={{
            padding: '14px 24px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#065f4630', color: '#34d399', border: '1px solid #05966950' }}>
              ✓ PAYMENT VERIFIED RECEIVING
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Receipt: <strong>{receiptNo}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={14} /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#cbd5e1',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-payment-receipt" style={{ padding: '28px 32px' }}>
          {/* Receipt Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed rgba(255,255,255,0.15)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', letterSpacing: '1px' }}>
                PM SURYA GHAR: MUFT BIJLI YOJANA
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '4px 0 2px' }}>
                Registration Payment Receipt & Receiving
              </h1>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Authorized Solar Field Survey & DBT Subsidy Application Receiving
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Receipt Number</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{receiptNo}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{receiptDate}</div>
            </div>
          </div>

          {/* 3-Column Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* Amount Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Registration Charge Paid</span>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#34d399', margin: '4px 0' }}>
                ₹{Number(feeAmount).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Mode: {payMode}
              </div>
            </div>

            {/* Application ID Box */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Solar Application ID</span>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#f59e0b', margin: '6px 0 4px', fontFamily: 'monospace' }}>
                {application.registrationId}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                CA No: <strong style={{ color: '#fff' }}>{application.consumerNo}</strong>
              </div>
            </div>

            {/* Receiving Officer Box */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Payment Received By</span>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
                {application.agentName || application.executiveName || 'Field Agent'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
                ID: {application.agentCode || application.executiveId || 'AGT-101-01-01'}
              </div>
            </div>
          </div>

          {/* Section 1: Customer & Property Particulars */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '12px' }}>
              1. Candidate & Identification Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Customer Name:</span>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{application.fullName}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Registered Mobile:</span>
                <div style={{ fontWeight: 700, color: '#fff' }}>{application.mobile}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Aadhaar Number:</span>
                <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                  {application.aadhaarNumber || '7829-4455-8910'}
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>PAN Card Number:</span>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                  {application.panNumber || 'ABCDE9876K'}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Installed / Property Address:</span>
                <div style={{ color: '#e2e8f0', marginTop: '2px', lineHeight: 1.4 }}>
                  {application.propertyAddress || application.address || 'Rohini Sector 15, New Delhi'}
                  {application.pinCode ? ` - PIN: ${application.pinCode}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Online Payment & Screenshot Proof */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#10b981', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '12px' }}>
              2. Transaction & Online Payment Proof
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Payment Mode:</span>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{payMode}</div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Transaction ID / UTR:</span>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{txnId}</div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Franchise Distributor Hub:</span>
                  <div style={{ color: '#e2e8f0' }}>{application.distributorName || 'Nandani Enterprise'} ({application.distributorCode || 'DST-101-01'})</div>
                </div>
              </div>

              {/* Payment Screenshot Preview */}
              <div>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '6px' }}>Uploaded Payment Screenshot / Receipt:</span>
                {screenshotUrl ? (
                  <div style={{ position: 'relative', width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }} onClick={() => setActiveImgZoom(true)}>
                    <img 
                      src={screenshotUrl} 
                      alt="Payment Proof" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '2px' }}>
                      Click to Enlarge
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
                    Online payment verified on field terminal
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Consumer Login Access Box (Highlight for Customer) */}
          <div style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '13px' }}>
                <Key size={16} /> Consumer Portal Live Progress Tracking Credentials
              </div>
              <button
                type="button"
                className="no-print"
                onClick={handleCopyCredentials}
                style={{
                  background: copied ? '#059669' : 'rgba(56, 189, 248, 0.2)',
                  color: copied ? '#fff' : '#38bdf8',
                  border: '1px solid ' + (copied ? '#059669' : 'rgba(56, 189, 248, 0.4)'),
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Copy size={12} /> {copied ? 'Copied to Clipboard!' : 'Copy Login Details'}
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 12px', lineHeight: 1.4 }}>
              Consumer can log in to the official portal to track live progress across Distributor, EPC Partner, Admin, and Bank Financer sanction stages.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Login ID (Registered Email):</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
                  {loginId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Password (FirstName@Last4Digits):</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', marginTop: '2px' }}>
                  {loginPass}
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Statutory Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Applicant Consent</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{application.fullName}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Digitally Accepted & Authenticated</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Authorized Field Executive Stamp</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                {application.agentName || application.executiveName || 'Field Agent'}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                SolarConnect Certified Field Agent ({application.agentCode || application.executiveId || 'AGT-101-01-01'})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {activeImgZoom && screenshotUrl && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setActiveImgZoom(false)}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={screenshotUrl} alt="Zoomed Payment Proof" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '10px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
