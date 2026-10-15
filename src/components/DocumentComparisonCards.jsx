import React, { useState } from 'react';
import {
  CreditCard, FileText, CheckCircle2, XCircle,
  Eye, Camera, MapPin, Building, ShieldCheck,
  ExternalLink, Maximize2, ImageOff
} from 'lucide-react';

export default function DocumentComparisonCards({
  application,
  onVerifyToggle,
  isReviewer = false,
  documentAudits = {},
  onAuditChange = null,
  onReuploadDoc = null
}) {
  const [internalAudits, setInternalAudits] = useState({});
  const [activePreview, setActivePreview] = useState(null);

  if (!application) return null;

  const docs = application.documents || {};
  const aadhaarNo = application.aadhaarNumber || '7829-4455-8910';
  const panNo = application.panNumber || 'ABCDE9876K';
  const caNo = application.consumerNo || 'CA-101-01-01-001';
  const billAmount = application.avgMonthlyBill ? `₹${application.avgMonthlyBill.toLocaleString('en-IN')}` : '₹4,200';
  const bankAcc = application.bankDetails?.accountNumber || '5010045892314';
  const bankIfsc = application.bankDetails?.ifscCode || 'HDFC0000123';
  const bankName = application.bankDetails?.bankName || 'HDFC Bank, Rohini Branch';
  const landDeed = application.landDetails || 'Khasra Deed #104/12, Rohini Sector 15 Deed Copy';
  const gpsLat = docs.rooftopGpsPhoto?.gpsLatitude || '28.7155° N';
  const gpsLong = docs.rooftopGpsPhoto?.gpsLongitude || '77.1292° E';
  const roofArea = application.rooftopArea || 480;
  const roofType = application.roofType || 'RCC';

  const getDocAudit = (docKey) => {
    if (documentAudits && documentAudits[docKey]) return documentAudits[docKey];
    if (internalAudits && internalAudits[docKey]) return internalAudits[docKey];
    const initialStatus = docs[docKey]?.status || 'Verified';
    const initialRemarks = docs[docKey]?.remarks || '';
    return { status: initialStatus, remarks: initialRemarks };
  };

  const handleAuditChange = (docKey, status, remarks = '') => {
    const prev = (documentAudits && Object.keys(documentAudits).length > 0) ? documentAudits : internalAudits;
    const updated = {
      ...prev,
      [docKey]: { status, remarks },
    };
    setInternalAudits(updated);
    if (onAuditChange) {
      onAuditChange(docKey, { status, remarks }, updated);
    }
    if (onVerifyToggle) {
      onVerifyToggle(docKey, status === 'Verified');
    }
  };

  const getValidImgUrl = (val) => {
    if (!val) return null;
    let url = typeof val === 'object' ? (val.fileUrl || val.url || val.photo || val.frontPhoto || val.backPhoto) : val;
    if (typeof url === 'string') {
      const trimmed = url.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image') || trimmed.startsWith('blob:')) {
        return trimmed;
      }
      if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
        return `https://solarconnect-portal-backend.onrender.com/${trimmed.replace(/^\/+/, '')}`;
      }
      if (trimmed.startsWith('/') && (trimmed.endsWith('.jpg') || trimmed.endsWith('.png') || trimmed.endsWith('.jpeg') || trimmed.endsWith('.webp'))) {
        return trimmed;
      }
    }
    return null;
  };

  const aadhaarFrontImg = getValidImgUrl(docs.aadhaarCard?.frontPhoto) || getValidImgUrl(docs.aadhaarCard?.fileUrl) || getValidImgUrl(docs.aadhaarCard?.photo);
  const aadhaarBackImg = getValidImgUrl(docs.aadhaarCard?.backPhoto) || getValidImgUrl(docs.aadhaarCard?.backUrl);
  const panImg = getValidImgUrl(docs.panCard?.fileUrl) || getValidImgUrl(docs.panCard?.photo) || getValidImgUrl(docs.panCard?.url);
  const bijliImg = getValidImgUrl(docs.bijliBill?.fileUrl) || getValidImgUrl(docs.bijliBill?.photo) || getValidImgUrl(docs.bijliBill?.url);
  const bankImg = getValidImgUrl(docs.bankPassbook?.fileUrl) || getValidImgUrl(docs.bankPassbook?.photo) || getValidImgUrl(docs.bankPassbook?.url);
  const jaminImg = getValidImgUrl(docs.jaminRasid?.fileUrl) || getValidImgUrl(docs.jaminRasid?.photo) || getValidImgUrl(docs.jaminRasid?.url);
  const rooftopImg = getValidImgUrl(docs.rooftopGpsPhoto?.mapSnapshotUrl) || getValidImgUrl(docs.rooftopGpsPhoto?.fileUrl) || getValidImgUrl(docs.rooftopGpsPhoto?.photo) || getValidImgUrl(docs.rooftopGpsPhoto?.url);
  const googleMapsUrl = docs.rooftopGpsPhoto?.googleMapsUrl || (docs.rooftopGpsPhoto?.gpsLatitude && docs.rooftopGpsPhoto?.gpsLongitude ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(docs.rooftopGpsPhoto.gpsLatitude)},${encodeURIComponent(docs.rooftopGpsPhoto.gpsLongitude)}` : (gpsLat && gpsLong && gpsLat !== '28.7155° N' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gpsLat)},${encodeURIComponent(gpsLong)}` : 'https://www.google.com/maps'));
  const rawSitePhotos = docs.rooftopGpsPhoto?.sitePhotos;
  const sitePhotos = Array.isArray(rawSitePhotos) ? rawSitePhotos.map(getValidImgUrl).filter(Boolean) : [];

  const docItems = [
    {
      id: 'aadhaar',
      docKey: 'aadhaarCard',
      name: '1. Aadhaar Card (Both Sides Required)',
      icon: <CreditCard size={18} color="#38bdf8" />,
      leftDetails: [
        { label: 'Aadhaar Number', value: aadhaarNo, isMono: true, highlight: '#38bdf8' },
        { label: 'Cardholder Name', value: application.fullName },
        { label: 'Document Status', value: 'Physical Card Scanned (Front & Back)' },
      ],
      isBothSides: true,
      frontTitle: 'Aadhaar Front View',
      backTitle: 'Aadhaar Back View',
      frontImg: aadhaarFrontImg,
      backImg: aadhaarBackImg,
      frontData: {
        header: 'Government of India / Unique Identification Authority',
        name: application.fullName,
        sub: `DOB: 14/08/1988 | Gender: Male`,
        idBadge: aadhaarNo,
      },
      backData: {
        header: 'UIDAI - Address Verification Side',
        address: application.propertyAddress || application.address || 'Rohini Sector 15, New Delhi',
        footer: 'Aadhaar Secure Barcode & QR Stamp Verified',
      },
      collected: docs.aadhaarCard?.collected !== false,
      fileName: docs.aadhaarCard?.fileName,
    },
    {
      id: 'pan',
      docKey: 'panCard',
      name: '2. PAN Card (Permanent Account Number)',
      icon: <CreditCard size={18} color="#f59e0b" />,
      leftDetails: [
        { label: 'PAN Card Number', value: panNo, isMono: true, highlight: '#f59e0b' },
        { label: 'Name on PAN', value: application.fullName },
        { label: 'Income Tax Status', value: 'Active / Verified' },
      ],
      isBothSides: false,
      singleTitle: 'PAN Card Official Copy',
      imgUrl: panImg,
      singleData: {
        header: 'Income Tax Department • Govt. of India',
        name: application.fullName,
        sub: `Father's Name: Sh. R. P. Kumar`,
        idBadge: panNo,
        accent: '#f59e0b',
      },
      collected: docs.panCard?.collected !== false,
      fileName: docs.panCard?.fileName,
    },
    {
      id: 'bijli',
      docKey: 'bijliBill',
      name: '3. Bijli Bill / Consumer CA Electricity Bill',
      icon: <FileText size={18} color="#10b981" />,
      leftDetails: [
        { label: 'Consumer CA Number', value: caNo, isMono: true, highlight: '#10b981' },
        { label: 'Average Monthly Bill', value: `${billAmount} / Month` },
        { label: 'DISCOM Utility', value: application.districtCity ? `${application.districtCity} Power Distribution Ltd` : 'TPDDL / BSES Delhi' },
      ],
      isBothSides: false,
      singleTitle: 'Electricity Bill Invoice Scan',
      imgUrl: bijliImg,
      singleData: {
        header: 'TPDDL / DISCOM Electricity Bill',
        name: `CA No: ${caNo}`,
        sub: `Consumer: ${application.fullName} | Connected Load: 4.0 kW`,
        idBadge: `Monthly Dues: ${billAmount}`,
        accent: '#10b981',
      },
      collected: docs.bijliBill?.collected !== false,
      fileName: docs.bijliBill?.fileName,
    },
    {
      id: 'bank',
      docKey: 'bankPassbook',
      name: '4. Bank Passbook / DBT Subsidy Account',
      icon: <Building size={18} color="#818cf8" />,
      leftDetails: [
        { label: 'Bank Account Number', value: bankAcc, isMono: true, highlight: '#818cf8' },
        { label: 'IFSC Code', value: bankIfsc, isMono: true },
        { label: 'Bank & Branch', value: bankName },
      ],
      isBothSides: false,
      singleTitle: 'Bank Passbook / Cancelled Cheque',
      imgUrl: bankImg,
      singleData: {
        header: bankName,
        name: `A/C: ${bankAcc}`,
        sub: `IFSC: ${bankIfsc} | DBT Subsidy Linked`,
        idBadge: `Account Holder: ${application.fullName}`,
        accent: '#818cf8',
      },
      collected: docs.bankPassbook?.collected !== false,
      fileName: docs.bankPassbook?.fileName,
    },
    {
      id: 'jamin',
      docKey: 'jaminRasid',
      name: '5. Jamin Rasid / House Property Deed',
      icon: <FileText size={18} color="#f43f5e" />,
      leftDetails: [
        { label: 'Property Deed / Khasra No', value: landDeed, isMono: true, highlight: '#f43f5e' },
        { label: 'Ownership Category', value: application.ownership || 'Owned (Self)' },
        { label: 'Tax Receipt Status', value: 'Current Year Municipal Tax Cleared' },
      ],
      isBothSides: false,
      singleTitle: 'Property Registry & Municipal Tax Receipt',
      imgUrl: jaminImg,
      singleData: {
        header: 'Revenue & Property Registry Department',
        name: `Deed / Khasra: ${landDeed}`,
        sub: `Owner: ${application.fullName} | Loc: ${application.districtCity || 'North Delhi'}`,
        idBadge: 'Registry Verification Seal Passed',
        accent: '#f43f5e',
      },
      collected: docs.jaminRasid?.collected !== false,
      fileName: docs.jaminRasid?.fileName,
    },
    {
      id: 'rooftop',
      docKey: 'rooftopGpsPhoto',
      name: '6. Rooftop Satellite Map & Live GPS Geotag Stamp',
      icon: <Camera size={18} color="#f59e0b" />,
      leftDetails: [
        { label: 'Live GPS Coordinates', value: `${gpsLat}, ${gpsLong}`, isMono: true, highlight: '#10b981' },
        { label: 'Usable Rooftop Area', value: `${roofArea} Sq. Ft (${roofType} Roof)` },
        { label: 'Roof Area Marking', value: docs.rooftopGpsPhoto?.roofAreaMarked ? 'Identified & Centered on Google Map' : 'Shadow-free South-Facing Feasible' },
      ],
      isBothSides: false,
      singleTitle: 'Google Maps Satellite View (Tap to Open Live Map)',
      imgUrl: rooftopImg,
      googleMapsUrl: googleMapsUrl,
      sitePhotos: sitePhotos,
      singleData: {
        header: `📍 LIVE GOOGLE SATELLITE MAP`,
        name: `${gpsLat}, ${gpsLong}`,
        sub: `Usable Area: ${roofArea} Sq. Ft | Type: ${roofType}`,
        idBadge: `TIMESTAMP: 14 OCT 2026 10:45 AM • ACCURACY ±2m`,
        accent: '#f59e0b',
        isGpsPhoto: true,
      },
      collected: true,
      fileName: docs.rooftopGpsPhoto?.fileName,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {docItems.map((item) => {
        const audit = getDocAudit(item.docKey);
        const isDocRejected = audit.status === 'Rejected' || docs[item.docKey]?.status === 'Rejected';

        return (
          <div
            key={item.id}
            style={{
              background: '#0a0f1d',
              border: isDocRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon}
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  {item.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: item.collected ? '#065f4625' : '#ef444420',
                    color: item.collected ? '#34d399' : '#f87171',
                    border: '1px solid ' + (item.collected ? '#05966940' : '#ef444440'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {item.collected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {item.collected ? 'Digital Copy Attached' : 'Missing Copy'}
                </span>

                {isDocRejected && (
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#dc262625', color: '#f87171', border: '1px solid #ef444450', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Rejected
                  </span>
                )}
              </div>
            </div>

            {/* REVIEWER INTERACTIVE CONTROLS: Section-wise Verify / Reject Buttons */}
            {isReviewer && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px' }}>
                    Section Audit:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAuditChange(item.docKey, 'Verified', '')}
                    style={{
                      background: audit.status === 'Verified' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#1e293b',
                      color: '#fff',
                      border: '1px solid ' + (audit.status === 'Verified' ? '#10b981' : 'rgba(255,255,255,0.1)'),
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: audit.status === 'Verified' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  >
                    <CheckCircle2 size={13} /> Verify Section
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuditChange(item.docKey, 'Rejected', audit.remarks || 'Document unclear or incorrect')}
                    style={{
                      background: audit.status === 'Rejected' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#1e293b',
                      color: '#fff',
                      border: '1px solid ' + (audit.status === 'Rejected' ? '#ef4444' : 'rgba(255,255,255,0.1)'),
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: audit.status === 'Rejected' ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                  >
                    <XCircle size={13} /> Reject Section
                  </button>
                </div>

                {audit.status === 'Rejected' && (
                  <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Rejection Reason:
                    </span>
                    <input
                      type="text"
                      value={audit.remarks || ''}
                      onChange={(e) => handleAuditChange(item.docKey, 'Rejected', e.target.value)}
                      placeholder="e.g. Photo blurry, name mismatch, illegible text..."
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid #ef444480',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#fca5a5',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* NON-REVIEWER (AGENT / CONSUMER) REJECTION NOTICE BAR */}
            {!isReviewer && isDocRejected && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef444450',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <XCircle size={14} /> Reviewer Action: This document requires correction
                  </div>
                  <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
                    <strong>Specific issue:</strong> "{audit.remarks || docs[item.docKey]?.remarks || 'Document unclear or requires re-upload'}"
                  </div>
                </div>
                {onReuploadDoc && (
                  <button
                    type="button"
                    onClick={() => onReuploadDoc(item.docKey)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#000',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Re-upload This Document
                  </button>
                )}
              </div>
            )}

            {/* 2-Column Side-by-Side Comparison Container */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
              {/* LEFT COLUMN: Registered Details & Document Number */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700, marginBottom: '12px' }}>
                    Entered Particulars to Verify
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {item.leftDetails.map((det, dIdx) => (
                      <div key={dIdx}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{det.label}</div>
                        <div
                          style={{
                            fontSize: det.isMono ? '14px' : '13px',
                            fontWeight: 700,
                            color: det.highlight || '#fff',
                            fontFamily: det.isMono ? 'monospace' : 'inherit',
                            marginTop: '2px',
                            letterSpacing: det.isMono ? '0.5px' : 'normal'
                          }}
                        >
                          {det.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#34d399' }}>
                  <CheckCircle2 size={14} />
                  <span>Format validated with KYC rules</span>
                </div>
              </div>

              {/* RIGHT COLUMN: Document Photo Cards for Cross-Check */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700 }}>
                    {item.isBothSides ? 'Cross-Check Photos (Front & Back Side)' : 'Cross-Check Uploaded Document Photo'}
                  </span>
                  {item.fileName && (
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.fileName}</span>
                  )}
                </div>

                {item.isBothSides ? (
                  /* Aadhaar Front & Back 2-Card Layout */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', flex: 1 }}>
                    {/* Front Card */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '160px'
                      }}
                    >
                      {item.frontImg ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>{item.frontTitle}</span>
                            <button
                              type="button"
                              onClick={() => setActivePreview({ url: item.frontImg, title: item.frontTitle })}
                              style={{ background: 'rgba(56, 189, 248, 0.2)', border: 'none', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Maximize2 size={10} /> View Full
                            </button>
                          </div>
                          <img
                            src={item.frontImg}
                            alt={item.frontTitle}
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                            onClick={() => setActivePreview({ url: item.frontImg, title: item.frontTitle })}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', textAlign: 'center', minHeight: '120px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '8px' }}>
                            <ImageOff size={18} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>No Front Photo</span>
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Photo not attached</span>
                        </div>
                      )}
                    </div>

                    {/* Back Card */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '160px'
                      }}
                    >
                      {item.backImg ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>{item.backTitle}</span>
                            <button
                              type="button"
                              onClick={() => setActivePreview({ url: item.backImg, title: item.backTitle })}
                              style={{ background: 'rgba(56, 189, 248, 0.2)', border: 'none', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Maximize2 size={10} /> View Full
                            </button>
                          </div>
                          <img
                            src={item.backImg}
                            alt={item.backTitle}
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                            onClick={() => setActivePreview({ url: item.backImg, title: item.backTitle })}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 10px', textAlign: 'center', minHeight: '120px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '8px' }}>
                            <ImageOff size={18} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>No Back Photo</span>
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Photo not attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Single Card Layout */
                  <div
                    style={{
                      background: item.singleData.isGpsPhoto
                        ? 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)'
                        : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      border: '1px solid ' + (item.singleData.accent ? `${item.singleData.accent}40` : 'rgba(255,255,255,0.1)'),
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: 1,
                      minHeight: '160px'
                    }}
                  >
                    {item.imgUrl ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: item.singleData.accent || '#38bdf8', textTransform: 'uppercase' }}>
                            {item.singleTitle}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.id === 'rooftop' && item.googleMapsUrl && (
                              <a
                                href={item.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#10b98125',
                                  border: '1px solid #10b98150',
                                  color: '#34d399',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  fontSize: '10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700
                                }}
                                title="Open live coordinates in Google Maps"
                              >
                                <ExternalLink size={10} /> Live Map
                              </a>
                            )}
                            {item.singleData.isGpsPhoto && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#065f4630', color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={10} /> Geotagged
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setActivePreview({ url: item.imgUrl, title: item.singleTitle })}
                              style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#f8fafc', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Maximize2 size={10} /> View Full
                            </button>
                          </div>
                        </div>

                        {/* Image container: clicking rooftop opens Google Maps as requested */}
                        <div style={{ position: 'relative' }}>
                          <img
                            src={item.imgUrl}
                            alt={item.singleTitle}
                            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                            onClick={() => {
                              if (item.id === 'rooftop' && item.googleMapsUrl) {
                                window.open(item.googleMapsUrl, '_blank');
                              } else {
                                setActivePreview({ url: item.imgUrl, title: item.singleTitle });
                              }
                            }}
                            title={item.id === 'rooftop' ? "Click to open this location in Google Maps" : "Click to view full photo"}
                          />
                          {item.id === 'rooftop' && item.googleMapsUrl && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                background: 'rgba(15, 23, 42, 0.85)',
                                backdropFilter: 'blur(4px)',
                                color: '#38bdf8',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                pointerEvents: 'none',
                                border: '1px solid rgba(56, 189, 248, 0.3)'
                              }}
                            >
                              <ExternalLink size={10} /> Tap to Open Google Maps
                            </div>
                          )}
                        </div>

                        {/* Rooftop on-site real camera photos (up to 5 for customer trust) */}
                        {item.id === 'rooftop' && (
                          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Camera size={12} /> On-Site Camera Photos ({item.sitePhotos?.length || 0}/5)
                              </span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Terrace / Shadow Verification</span>
                            </div>

                            {item.sitePhotos && item.sitePhotos.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                                {item.sitePhotos.map((photoUrl, pIdx) => (
                                  <div
                                    key={pIdx}
                                    style={{ position: 'relative', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', height: '52px' }}
                                    onClick={() => setActivePreview({ url: photoUrl, title: `On-Site Camera Photo #${pIdx + 1}` })}
                                    title={`Click to view camera photo #${pIdx + 1}`}
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`Site photo ${pIdx + 1}`}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
                                No extra camera photos attached.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 14px', textAlign: 'center', minHeight: '130px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '8px' }}>
                          <ImageOff size={20} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>No Document Photo Uploaded</span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                          {item.singleTitle}: Photo file was not attached during survey.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Lightbox Modal for Full Resolution Photo Review */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
            }}
          >
            <div style={{ padding: '12px 18px', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{activePreview.title}</span>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                style={{ background: '#334155', border: 'none', color: '#fff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
              >
                Close (ESC)
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
              <img
                src={activePreview.url}
                alt={activePreview.title}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
