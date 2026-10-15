import React from 'react';
import { 
  CheckCircle2, Clock, XCircle, AlertTriangle, 
  ShieldCheck, UserCheck, Building2, Wrench, X, 
  Calendar, FileText, ChevronRight
} from 'lucide-react';

export default function VerificationTrackerModal({ application, onClose }) {
  if (!application) return null;

  const st = application.overallStatus || (application.verification?.status === 'Verified' ? 'Distributor_Verified' : 'Pending_Distributor');
  const distVer = application.distributorVerification || {};
  const adminVer = application.adminVerification || {};
  const partnerDet = application.partnerDetails || {};
  const financeDet = application.financingDetails || {};
  const paymentDet = application.paymentDetails || {};

  // Milestone 1: Agent Registration & Payment
  const step1 = {
    title: '1. Field Agent Survey & Fee Submission',
    actor: application.agentName || application.executiveName || 'Field Agent',
    code: application.agentCode || application.executiveId || 'AGT-101-01',
    date: application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Completed',
    status: 'COMPLETED',
    notes: `All 10-point customer data & ₹${paymentDet.amount || 500} registration payment registered on field terminal.`,
  };

  // Milestone 2: Distributor Document Audit
  let step2Status = 'PENDING';
  let step2Notes = 'Awaiting distributor physical document inspection and candidate audit.';
  if (st === 'Rejected_By_Distributor' || distVer.status === 'Rejected') {
    step2Status = 'REJECTED';
    step2Notes = distVer.rejectionReason || application.verification?.remarks || 'Documents rejected during distributor audit.';
  } else if (['Distributor_Verified', 'Assigned_To_Partner', 'Feasibility_Approved', 'Finance_Approved', 'All_Verified', 'Admin_Approved', 'Installation_Complete'].includes(st) || distVer.status === 'Verified') {
    step2Status = 'VERIFIED';
    step2Notes = 'Aadhaar, PAN, Bijli Bill & property papers physically verified. Forwarded to EPC Partner.';
  }

  const step2 = {
    title: '2. Distributor Document Verification Desk',
    actor: application.distributorName || 'Distributor Franchise Hub',
    code: application.distributorCode || 'DST-101-01',
    date: distVer.verifiedAt ? new Date(distVer.verifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (step2Status === 'VERIFIED' ? 'Verified' : 'Pending'),
    status: step2Status,
    notes: step2Notes,
  };

  // Milestone 3: EPC Partner Technical & Rooftop Feasibility Desk
  let step3Status = 'WAITING';
  let step3Notes = 'Will proceed to Partner once distributor document verification is passed.';
  if (step2Status === 'REJECTED') {
    step3Status = 'BLOCKED';
    step3Notes = 'Blocked due to distributor rejection. Pending agent correction.';
  } else if (step2Status === 'VERIFIED') {
    if (['Feasibility_Approved', 'Finance_Approved', 'All_Verified', 'Installation_Complete'].includes(st) || partnerDet.status === 'Feasibility_Approved') {
      step3Status = 'VERIFIED';
      step3Notes = partnerDet.feasibilityNotes || 'Rooftop shadow-free area & structural stability approved by EPC Partner.';
    } else if (partnerDet.status === 'Feasibility_Rejected') {
      step3Status = 'REJECTED';
      step3Notes = partnerDet.feasibilityNotes || 'Rooftop unsuitable or load mismatch identified by Partner.';
    } else {
      step3Status = 'IN_REVIEW';
      step3Notes = `Dispatched to ${partnerDet.partnerName || 'Solarize'}. Technical rooftop feasibility in progress.`;
    }
  }

  const step3 = {
    title: '3. EPC Partner Technical & Rooftop Feasibility',
    actor: partnerDet.partnerName || 'Solarize',
    code: partnerDet.partnerCode || 'PRT-101-01',
    date: partnerDet.assignedAt ? new Date(partnerDet.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (step3Status === 'VERIFIED' ? 'Approved' : 'Pending'),
    status: step3Status,
    notes: step3Notes,
  };

  // Milestone 4: State Admin Sanction & Forwarding to Financer
  let step4Status = 'WAITING';
  let step4Notes = 'Admin will sanction and dispatch to Financer once partner approves feasibility.';
  if (step3Status === 'REJECTED' || step2Status === 'REJECTED') {
    step4Status = 'BLOCKED';
    step4Notes = 'Application blocked due to prior milestone rejection.';
  } else if (step3Status === 'VERIFIED') {
    if (st === 'Rejected_By_Admin' || adminVer.status === 'Rejected') {
      step4Status = 'REJECTED';
      step4Notes = adminVer.rejectionReason || 'Sanction rejected by Vijay Kumar Singh.';
    } else if (['Finance_Approved', 'All_Verified', 'Installation_Complete'].includes(st) || adminVer.status === 'Approved') {
      step4Status = 'VERIFIED';
      step4Notes = `Administrative sanction passed. File dispatched to Financer: ${financeDet.financerName || 'SBI'}.`;
    } else {
      step4Status = 'IN_REVIEW';
      step4Notes = 'Feasibility verified by Partner. State Admin reviewing file for Financer dispatch.';
    }
  }

  const step4 = {
    title: '4. State Admin Sanction & Financer Dispatch',
    actor: adminVer.verifiedBy || application.adminName || 'Vijay Kumar Singh',
    code: application.adminCode || 'ADM-101',
    date: adminVer.verifiedAt ? new Date(adminVer.verifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (step4Status === 'VERIFIED' ? 'Dispatched' : 'Pending'),
    status: step4Status,
    notes: step4Notes,
  };

  // Milestone 5: Financer (Bank / NBFC) Subsidy & Loan Sanction
  let step5Status = 'WAITING';
  let step5Notes = 'Awaiting Admin sanction before bank loan & PM Surya Ghar subsidy approval.';
  if (step4Status === 'VERIFIED') {
    if (['All_Verified', 'Finance_Approved', 'Installation_Complete'].includes(st) || financeDet.status === 'Approved') {
      step5Status = 'VERIFIED';
      step5Notes = financeDet.remarks || 'PM Surya Ghar 7% subsidized solar loan sanctioned & DBT subsidy approved. ALL VERIFIED!';
    } else if (financeDet.status === 'Rejected') {
      step5Status = 'REJECTED';
      step5Notes = financeDet.remarks || 'Credit verification or income criteria not met.';
    } else {
      step5Status = 'IN_REVIEW';
      step5Notes = `Loan sanction & subsidy docket under underwriting with ${financeDet.financerName || 'SBI'}.`;
    }
  }

  const step5 = {
    title: '5. Financer Subsidy & Loan Sanction (All Verified)',
    actor: financeDet.financerName || 'SBI',
    code: financeDet.financerCode || 'FIN-101-01',
    date: financeDet.status === 'Approved' ? 'Sanctioned' : 'Pending',
    status: step5Status,
    notes: step5Notes,
  };

  const steps = [step1, step2, step3, step4, step5];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'VERIFIED':
      case 'APPROVED':
      case 'ASSIGNED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#065f4630', color: '#34d399', border: '1px solid #05966950', fontSize: '12px', fontWeight: 700 }}>
            <CheckCircle2 size={13} /> {status === 'ASSIGNED' ? 'Allotted' : (status === 'APPROVED' ? 'Sanctioned' : 'Verified')}
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#0284c725', color: '#38bdf8', border: '1px solid #0284c750', fontSize: '12px', fontWeight: 700 }}>
            <Clock size={13} /> Under Review (Admin Desk)
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', fontSize: '12px', fontWeight: 700 }}>
            <Clock size={13} /> Pending Verification
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#ef444425', color: '#f87171', border: '1px solid #ef444450', fontSize: '12px', fontWeight: 700 }}>
            <XCircle size={13} /> Rejected
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: 600 }}>
            <Clock size={13} /> Waiting Prior Step
          </span>
        );
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.85)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 150, 
        padding: '20px' 
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: '#0f172a', 
          border: '1px solid rgba(255,255,255,0.15)', 
          borderRadius: '20px', 
          maxWidth: '720px', 
          width: '100%', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <ShieldCheck size={16} /> Application Verification Lifecycle Tracker
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 3px', color: '#fff' }}>
              {application.fullName}
            </h2>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Reg ID: <strong style={{ color: '#f59e0b' }}>{application.registrationId}</strong> | CA No: <strong style={{ color: '#fff' }}>{application.consumerNo}</strong>
            </div>
          </div>
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

        {/* Current Status Highlights Banner */}
        <div 
          style={{ 
            background: step2Status === 'REJECTED' || step3Status === 'REJECTED' || step4Status === 'REJECTED' || step5Status === 'REJECTED'
              ? '#ef444415' 
              : (step5Status === 'VERIFIED' ? '#065f4625' : '#0284c715'), 
            border: '1px solid ' + (step2Status === 'REJECTED' || step3Status === 'REJECTED' || step4Status === 'REJECTED' || step5Status === 'REJECTED' ? '#ef444440' : (step5Status === 'VERIFIED' ? '#05966950' : '#0284c740')), 
            borderRadius: '14px', 
            padding: '16px', 
            marginBottom: '24px' 
          }}
        >
          <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, color: step2Status === 'REJECTED' || step3Status === 'REJECTED' || step4Status === 'REJECTED' || step5Status === 'REJECTED' ? '#f87171' : (step5Status === 'VERIFIED' ? '#34d399' : '#38bdf8') }}>
            Current Verification Stage
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
            {step2Status === 'REJECTED' && '❌ Application Rejected by Distributor Franchise'}
            {step3Status === 'REJECTED' && '❌ Feasibility Rejected by EPC Partner'}
            {step4Status === 'REJECTED' && '❌ Sanction Rejected by State Admin Desk'}
            {step5Status === 'REJECTED' && '❌ Subsidy/Loan Rejected by Financer'}
            {step2Status === 'PENDING' && '⏳ Stage 2: Pending Distributor Document Verification'}
            {step2Status === 'VERIFIED' && step3Status === 'IN_REVIEW' && '🔍 Stage 3: Distributor Verified ➔ Under EPC Partner Feasibility Check'}
            {step3Status === 'VERIFIED' && step4Status === 'IN_REVIEW' && '⚙️ Stage 4: Partner Feasibility Approved ➔ Under Admin Sanction Desk'}
            {step4Status === 'VERIFIED' && step5Status === 'IN_REVIEW' && '🏛️ Stage 5: Admin Sanctioned ➔ Under Bank Financer Loan & Subsidy Approval'}
            {step5Status === 'VERIFIED' && '🎉 ALL VERIFIED! PM Surya Ghar Subsidy & Loan Sanction Approved'}
          </div>
        </div>

        {/* Step-by-Step Progress Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.map((s, idx) => {
            const isDone = ['COMPLETED', 'VERIFIED', 'APPROVED', 'ASSIGNED'].includes(s.status);
            const isCurrent = s.status === 'IN_REVIEW' || s.status === 'PENDING';
            const isRejected = s.status === 'REJECTED';

            return (
              <div 
                key={idx}
                style={{ 
                  background: isCurrent ? 'rgba(56, 189, 248, 0.05)' : (isRejected ? 'rgba(239, 68, 68, 0.05)' : '#090d16'), 
                  border: '1px solid ' + (isCurrent ? '#0284c740' : (isRejected ? '#ef444440' : (isDone ? '#05966940' : 'rgba(255,255,255,0.06)'))), 
                  borderRadius: '14px', 
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}
              >
                {/* Step Icon */}
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    flexShrink: 0,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: isDone ? '#065f4630' : (isRejected ? '#ef444430' : (isCurrent ? '#0284c730' : 'rgba(255,255,255,0.05)')),
                    color: isDone ? '#34d399' : (isRejected ? '#f87171' : (isCurrent ? '#38bdf8' : '#64748b')),
                    border: '1px solid ' + (isDone ? '#059669' : (isRejected ? '#ef4444' : (isCurrent ? '#38bdf8' : 'rgba(255,255,255,0.1)'))),
                    fontWeight: 800,
                    fontSize: '14px'
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : (isRejected ? <XCircle size={18} /> : (idx + 1))}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                      {s.title}
                    </div>
                    {getStatusBadge(s.status)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <span>By: <strong style={{ color: '#e2e8f0' }}>{s.actor}</strong> ({s.code})</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {s.date}
                    </span>
                  </div>

                  {/* Notes / Reason */}
                  <div 
                    style={{ 
                      marginTop: '8px', 
                      fontSize: '13px', 
                      lineHeight: 1.4, 
                      color: isRejected ? '#fca5a5' : '#cbd5e1',
                      background: isRejected ? '#ef444415' : 'rgba(255,255,255,0.02)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderLeft: isRejected ? '3px solid #ef4444' : (isDone ? '3px solid #10b981' : '3px solid #334155')
                    }}
                  >
                    {isRejected && <strong style={{ color: '#f87171' }}>Rejection Reason: </strong>}
                    {s.notes}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
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
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
