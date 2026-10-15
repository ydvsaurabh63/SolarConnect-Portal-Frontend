import React from 'react';
import { 
  X, UserCheck, Phone, Mail, MapPin, Zap, 
  Home, Building, ShieldCheck, AlertTriangle, 
  FileEdit, Printer, CheckCircle2, Clock, XCircle 
} from 'lucide-react';
import DocumentComparisonCards from './DocumentComparisonCards';

export default function SurveyDetailsModal({ application, onClose, onEdit, isAgent = false }) {
  if (!application) return null;

  const st = application.overallStatus || (application.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
  const isRejected = ['Rejected_By_Distributor', 'Rejected_By_Admin'].includes(st) || application.verification?.status === 'Rejected';
  const rejectionReason = application.distributorVerification?.rejectionReason || application.adminVerification?.rejectionReason || application.verification?.remarks;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.85)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 140, 
        padding: '20px' 
      }}
      onClick={onClose}
    >
      <div 
        className="survey-details-modal-box"
        style={{ 
          background: '#0f172a', 
          border: '1px solid rgba(255,255,255,0.15)', 
          borderRadius: '20px', 
          maxWidth: '920px', 
          width: '100%', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <UserCheck size={16} /> Complete Consumer Field Survey Booklet
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 3px', color: '#fff' }}>
              {application.fullName}
            </h2>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Reg ID: <strong style={{ color: '#f59e0b' }}>{application.registrationId}</strong> | Consumer CA No: <strong style={{ color: '#fff' }}>{application.consumerNo}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isRejected && isAgent && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(application);
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileEdit size={15} /> Edit & Re-submit
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Print Survey Details (A4 Format)"
            >
              <Printer size={15} /> Print Form
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{ 
                background: 'rgba(255,255,255,0.06)', 
                border: 'none', 
                color: '#94a3b8', 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Rejection Alert Banner (If rejected) */}
        {isRejected && (
          <div 
            style={{ 
              background: '#ef444415', 
              border: '1px solid #ef444450', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <AlertTriangle size={24} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px' }}>
                Application Was Rejected by Reviewer Desk
              </div>
              <div style={{ color: '#fca5a5', fontSize: '13px', marginTop: '4px', lineHeight: 1.4 }}>
                <strong>Reason given: </strong> "{rejectionReason || 'Documents or survey data need correction.'}"
              </div>
              {isAgent && (
                <div style={{ color: '#fed7aa', fontSize: '12px', marginTop: '8px' }}>
                  💡 Click the <strong>"Edit & Re-submit"</strong> button above to correct the survey details and re-forward it to the Distributor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: Personal & Connection Particulars */}
        <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px', marginBottom: '22px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', margin: '0 0 14px', fontWeight: 700 }}>
            Consumer & Site Particulars
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Applicant Full Name</span>
              <strong style={{ color: '#fff' }}>{application.fullName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Mobile Number</span>
              <strong style={{ color: '#fff' }}>{application.mobile}</strong>
              {application.alternateNo && <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>(Alt: {application.alternateNo})</span>}
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Email Address</span>
              <strong style={{ color: '#fff' }}>{application.email || '—'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Electricity Consumer No</span>
              <strong style={{ color: '#f59e0b' }}>{application.consumerNo}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Average Electricity Bill</span>
              <strong style={{ color: '#f59e0b' }}>₹{application.avgMonthlyBill?.toLocaleString('en-IN')} / month</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Rooftop Usable Area</span>
              <strong style={{ color: '#10b981' }}>{application.rooftopArea || 0} Sq. Ft ({application.roofType || 'RCC'})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Property Ownership</span>
              <strong style={{ color: '#fff' }}>{application.ownership || 'Owned'} ({application.propertyType || 'Residential'})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Land / Khasra Deed Details</span>
              <strong style={{ color: '#fff' }}>{application.landDetails || 'Verified from Registry'}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Installation Site Full Address</span>
              <strong style={{ color: '#fff' }}>{application.propertyAddress || application.address}</strong>
            </div>
          </div>
        </div>

        {/* SECTION 1b: Hierarchy & Consumer Portal Credentials */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          {/* Hierarchy Info */}
          <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.5px', margin: '0 0 12px', fontWeight: 700 }}>
              Hierarchy Team Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Field Agent: </span>
                <strong style={{ color: '#38bdf8' }}>{application.agentName || application.executiveName || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Distributor: </span>
                <strong style={{ color: '#a78bfa' }}>{application.distributorName || 'Nandani Enterprise'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Assigned Partner: </span>
                <strong style={{ color: '#fbbf24' }}>{application.partnerDetails?.partnerName || 'Central Partner Desk'}</strong>
              </div>
            </div>
          </div>

          {/* Consumer Login Credentials Box */}
          {(() => {
            const rawFirst = (application.fullName || 'User').trim().split(/\s+/)[0];
            const userFirstName = rawFirst ? (rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()) : 'User';
            const cleanMob = String(application.mobile || '').replace(/\D/g, '');
            const last4Mob = cleanMob.slice(-4) || '1234';
            const expectedPass = `${userFirstName}@${last4Mob}`;
            const displayLoginId = application.consumerAccount?.email || application.email || application.consumerAccount?.loginId || (cleanMob ? `${cleanMob}@solar.com` : application.consumerNo);
            const displayPass = (application.consumerAccount?.tempPassword && !application.consumerAccount.tempPassword.startsWith('Solar@') && !application.consumerAccount.tempPassword.startsWith('solar@') && application.consumerAccount.tempPassword !== 'user123')
              ? application.consumerAccount.tempPassword
              : expectedPass;

            return (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '16px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.5px', margin: '0 0 12px', fontWeight: 700 }}>
                  Consumer Portal Login Credentials
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Login ID (Email Address): </span>
                    <strong style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', wordBreak: 'break-all' }}>
                      {displayLoginId}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Password: </span>
                    <strong style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      {displayPass}
                    </strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Consumer can log in with their email. Password rule: FirstName@Last4DigitsOfMobile.
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* SECTION 1c: Payment Receipt & Screenshot */}
        {application.paymentDetails && (
          <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px', marginBottom: '22px' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.5px', margin: '0 0 14px', fontWeight: 700 }}>
              Registration Payment Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Amount Paid</span>
                <strong style={{ color: '#34d399' }}>₹{application.paymentDetails?.amount || 500}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Payment Mode</span>
                <strong style={{ color: '#fff' }}>{application.paymentDetails?.mode || 'UPI'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Transaction ID / UTR</span>
                <strong style={{ color: '#38bdf8' }}>{application.paymentDetails?.transactionId || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Receipt Number</span>
                <strong style={{ color: '#fbbf24' }}>{application.paymentDetails?.receiptNumber || `REC-${application.registrationId}`}</strong>
              </div>
              {application.paymentDetails?.paymentScreenshotUrl && (
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', marginBottom: '6px' }}>Online Payment Screenshot:</span>
                  <a href={application.paymentDetails.paymentScreenshotUrl} target="_blank" rel="noreferrer">
                    <img 
                      src={application.paymentDetails.paymentScreenshotUrl} 
                      alt="Payment Receipt Screenshot" 
                      style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }} 
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Side-by-Side 10-Point Document Cross-Verification Cards */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.5px', margin: '0 0 14px', fontWeight: 700 }}>
            Mandatory Documents: Number & Photo Side-by-Side Verification
          </h4>
          <DocumentComparisonCards application={application} isReviewer={false} />
        </div>

        {/* Modal Bottom Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '24px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Registered on: {application.createdAt ? new Date(application.createdAt).toLocaleString('en-IN') : '14 Oct 2026'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ 
              background: '#334155', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 700, 
              fontSize: '13px' 
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
