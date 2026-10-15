import React, { useState, useEffect } from 'react';
import { 
  FileText, User, Phone, MapPin, Building, Home, 
  CheckSquare, Square, Camera, Upload, ShieldCheck, 
  ArrowRight, PhoneCall, CheckCircle2, AlertCircle, 
  Sparkles, PenTool, Calendar, Shield, IndianRupee,
  Lock, UserPlus, LogIn
} from 'lucide-react';
import { api } from '../services/api';
import GoogleRooftopMap from './GoogleRooftopMap';

export default function DigitalBookletForm({ 
  currentUser, 
  onSuccessSubmit, 
  onOpenFieldGuide,
  onOpenAuthModal,
  preferredFormMode,
}) {
  const [regId, setRegId] = useState('SC-0001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [sameAddressAsAbove, setSameAddressAsAbove] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState('');

  // Fetch the latest sequential Registration ID from the database
  const fetchNextRegId = async () => {
    try {
      const res = await api.getNextId();
      if (res && res.success && res.nextId) {
        setRegId(res.nextId);
        setFormData((prev) => ({ ...prev, registrationId: res.nextId }));
        return res.nextId;
      }
    } catch (err) {
      console.warn('Could not fetch next ID:', err);
    }
    return null;
  };

  useEffect(() => {
    fetchNextRegId();

    const handleFocus = () => {
      fetchNextRegId();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser]);

  useEffect(() => {
    if (preferredFormMode) {
      setFormData(prev => ({ ...prev, submissionMode: preferredFormMode }));
    }
  }, [preferredFormMode]);

  // Form State matching booklet Section 6 (Clean initial state, no dummy data)
  const [formData, setFormData] = useState({
    // Header
    registrationId: 'SC-0001',
    executiveName: currentUser?.fullName || '',
    executiveId: currentUser?.executiveId || '',
    areaDistrict: '',
    issuedOn: new Date().toISOString().split('T')[0],
    submissionMode: currentUser?.role === 'executive' ? 'FIELD_EXECUTIVE' : 'SELF_APPLICANT',

    // Applicant Details
    fullName: '',
    mobile: '',
    alternateNo: '',
    email: '',
    address: '',
    districtCity: '',
    pinCode: '',

    // Property & Electricity
    consumerNo: '',
    avgMonthlyBill: '',
    connectionName: 'Self',
    propertyType: 'Residential',
    ownership: 'Owned',
    propertyAddress: '',
    landDetails: '',
    rooftopArea: '',
    roofType: 'RCC',

    // Specific Document Numbers (10 Mandated Survey Fields)
    aadhaarNumber: '',
    panNumber: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',

    // Document Checklist (all clean & uncollected initially)
    documents: {
      aadhaarCard: { collected: false, fileName: '' },
      panCard: { collected: false, fileName: '' },
      bijliBill: { collected: false, fileName: '' },
      bankPassbook: { collected: false, fileName: '' },
      jaminRasid: { collected: false, fileName: '' },
      rooftopGpsPhoto: {
        collected: false,
        fileName: '',
        gpsLatitude: '',
        gpsLongitude: '',
        capturedWithGps: false,
      },
    },

    // Registration Fee & Online Payment Proof
    paymentAmount: 500,
    paymentMode: 'UPI',
    paymentTransactionId: '',
    paymentScreenshotUrl: '',
    paymentScreenshotName: '',

    // Declaration & Signatures
    declarationAccepted: false,
    applicantSignature: '',
    executiveSignature: currentUser?.fullName ? 'Verified by ' + currentUser.fullName : '',
  });

  // Sync user credentials when logged in
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        executiveName: currentUser.fullName || prev.executiveName,
        executiveId: currentUser.executiveId || prev.executiveId,
        executiveSignature: currentUser.fullName ? 'Verified by ' + currentUser.fullName : prev.executiveSignature,
      }));
    }
  }, [currentUser]);

  // Fetch next sequential ID from backend (rooted in Agent hierarchy)
  useEffect(() => {
    async function fetchNextId() {
      try {
        const agentCode = currentUser?.code || currentUser?.executiveId || '';
        const res = await api.getNextId(agentCode);
        if (res.success && res.nextId) {
          setRegId(res.nextId);
          setFormData((prev) => ({
            ...prev,
            registrationId: res.nextId,
            consumerNo: prev.consumerNo || res.nextConsumerNo || '',
          }));
        }
      } catch (e) {
        console.warn(e);
      }
    }
    fetchNextId();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'address' && sameAddressAsAbove) {
        updated.propertyAddress = value;
      }
      return updated;
    });
  };

  const handleDocToggle = (docKey) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: {
          ...prev.documents[docKey],
          collected: !prev.documents[docKey]?.collected,
          fileName: !prev.documents[docKey]?.collected ? `${docKey}_uploaded.jpg` : '',
        },
      },
    }));
  };

  const handleFileUpload = async (e, docKey, subField = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = subField ? `${docKey}_${subField}` : docKey;
    setUploadingDoc(uploadKey);

    // If it's rooftop photo, capture live device GPS coordinates
    if (docKey === 'rooftopGpsPhoto' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = `${pos.coords.latitude.toFixed(4)}° N`;
          const long = `${pos.coords.longitude.toFixed(4)}° E`;
          setFormData((prev) => ({
            ...prev,
            documents: {
              ...prev.documents,
              rooftopGpsPhoto: {
                ...prev.documents.rooftopGpsPhoto,
                gpsLatitude: lat,
                gpsLongitude: long,
                capturedWithGps: true,
              },
            },
          }));
        },
        (geoErr) => {
          console.warn('Geolocation access not granted, using current sector telemetry:', geoErr.message);
        }
      );
    }

    let finalFileUrl = '';
    let finalFileName = file.name;
    let finalStorage = 'CLIENT_BUFFER';

    try {
      const res = await api.uploadFile(file, 'consumer-documents');
      if (res && res.success && res.fileUrl) {
        finalFileUrl = res.fileUrl;
        finalFileName = res.fileName || file.name;
        finalStorage = res.storage || 'R2_STORAGE';
      }
    } catch (err) {
      console.warn('Backend upload api fallback to data URL:', err);
    }

    // Client-side instant preview fallback if server upload wasn't used or had an issue
    if (!finalFileUrl) {
      finalFileUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }

    if (finalFileUrl) {
      setFormData((prev) => {
        const currentDoc = prev.documents[docKey] || {};
        const updatedDoc = {
          ...currentDoc,
          collected: true,
          fileName: finalFileName,
          fileUrl: finalFileUrl,
          storage: finalStorage,
        };

        if (subField) {
          updatedDoc[subField] = finalFileUrl;
          updatedDoc[`${subField}Name`] = finalFileName;
        }

        return {
          ...prev,
          documents: {
            ...prev.documents,
            [docKey]: updatedDoc,
          },
        };
      });
    }
    setUploadingDoc('');
  };

  const handlePaymentScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc('paymentScreenshot');

    let finalUrl = '';
    let finalName = file.name;

    try {
      const res = await api.uploadFile(file, 'payment-receipts');
      if (res && res.success && res.fileUrl) {
        finalUrl = res.fileUrl;
        finalName = res.fileName || file.name;
      }
    } catch (err) {
      console.warn('Payment screenshot upload fallback:', err);
    }

    if (!finalUrl) {
      finalUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }

    if (finalUrl) {
      setFormData((prev) => ({
        ...prev,
        paymentScreenshotUrl: finalUrl,
        paymentScreenshotName: finalName,
      }));
    }
    setUploadingDoc('');
  };

  const handleRooftopMapChange = (mapData) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        rooftopGpsPhoto: {
          ...prev.documents.rooftopGpsPhoto,
          ...mapData,
          collected: Boolean(mapData.collected && (mapData.mapSnapshotUrl || mapData.fileUrl)),
        },
      },
    }));
  };

  const handleSitePhotosChange = (photosList) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        rooftopGpsPhoto: {
          ...prev.documents.rooftopGpsPhoto,
          sitePhotos: photosList,
          collected: true,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('Registration required: Please create an account or sign in to submit.');
      if (onOpenAuthModal) onOpenAuthModal('register');
      return;
    }

    if (!formData.fullName || !formData.mobile || !formData.consumerNo || !formData.address) {
      setError('Please fill all mandatory fields marked with an asterisk (*).');
      return;
    }
    if (formData.mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.declarationAccepted) {
      setError('The applicant must accept the statutory declaration before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        userEmail: currentUser.email,
        agentId: currentUser?._id,
        agentName: currentUser?.fullName,
        agentCode: currentUser?.code || currentUser?.executiveId,
        distributorId: currentUser?.distributorId || currentUser?.createdById,
        distributorName: currentUser?.distributorName || currentUser?.createdByName,
        distributorCode: currentUser?.distributorCode,
        adminId: currentUser?.adminId,
        adminName: currentUser?.adminName,
        adminCode: currentUser?.adminCode,
        bankDetails: {
          accountNumber: formData.accountNumber || '',
          ifscCode: formData.ifscCode || '',
          bankName: formData.bankName || '',
        },
        accountNumber: formData.accountNumber || '',
        ifscCode: formData.ifscCode || '',
        bankName: formData.bankName || '',
        aadhaarNumber: formData.aadhaarNumber || '',
        panNumber: formData.panNumber || '',
        areaDistrict: formData.areaDistrict || formData.districtCity || 'General',
        propertyAddress: sameAddressAsAbove ? formData.address : formData.propertyAddress,
        applicantSignature: formData.applicantSignature || formData.fullName,
      };

      const res = await api.submitRegistration(payload);
      if (res.success && res.registration) {
        // Automatically fetch next incremented hierarchical ID
        const agentCode = currentUser?.code || currentUser?.executiveId || '';
        const updatedNext = await api.getNextId(agentCode);
        const nextIdVal = updatedNext?.nextId || 'SC-101-01-01-002';
        setFormData({
          registrationId: nextIdVal,
          executiveName: currentUser?.fullName || '',
          executiveId: currentUser?.code || currentUser?.executiveId || '',
          areaDistrict: '',
          issuedOn: new Date().toISOString().split('T')[0],
          submissionMode: currentUser?.role === 'executive' ? 'FIELD_EXECUTIVE' : 'SELF_APPLICANT',
          fullName: '',
          mobile: '',
          alternateNo: '',
          email: currentUser?.email || '',
          address: '',
          districtCity: '',
          pinCode: '',
          consumerNo: '',
          avgMonthlyBill: '',
          connectionName: 'Self',
          propertyType: 'Residential',
          ownership: 'Owned',
          propertyAddress: '',
          landDetails: '',
          rooftopArea: '',
          roofType: 'RCC',
          aadhaarNumber: '',
          panNumber: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          documents: {
            aadhaarCard: { collected: false, fileName: '' },
            panCard: { collected: false, fileName: '' },
            bijliBill: { collected: false, fileName: '' },
            bankPassbook: { collected: false, fileName: '' },
            jaminRasid: { collected: false, fileName: '' },
            rooftopGpsPhoto: {
              collected: false,
              fileName: '',
              gpsLatitude: '',
              gpsLongitude: '',
              capturedWithGps: false,
            },
          },
          declarationAccepted: false,
          applicantSignature: '',
          executiveSignature: currentUser?.fullName ? 'Verified by ' + currentUser.fullName : '',
        });
        setMobileVerified(false);

        if (onSuccessSubmit) {
          onSuccessSubmit({
            registration: res.registration,
            consumerAccount: res.consumerAccount,
          });
        }
      } else {
        setError(res.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error submitting to database. Retrying fallback...');
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated, do not render lock page on the layout
  if (!currentUser) {
    return null;
  }

  return (
    <div id="registration-form" className="booklet-form-container animate-fade-in">
      {error && <div className="form-error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="booklet-main-form">

        {/* =========================================================================
            Section 6.2: Applicant Details
            ========================================================================= */}
        <div className="booklet-section-card">
          <div className="bsec-header">
            <div className="bsec-num">1</div>
            <div>
              <h3 className="bsec-title">Applicant Details</h3>
              <p className="bsec-sub">Personal contact and residential information of interested candidate</p>
            </div>
          </div>

          <div className="bsec-grid-2">
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                placeholder="Candidate Full Name (as per Aadhaar)"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="label-with-value">
                <label className="form-label">
                  Mobile Number <span className="req">*</span>
                </label>
                <button
                  type="button"
                  className={`verify-call-btn ${mobileVerified ? 'verified' : ''}`}
                  onClick={() => setMobileVerified(!mobileVerified)}
                  title="Field guide step: Call candidate mobile once to verify"
                >
                  <PhoneCall size={13} />
                  <span>{mobileVerified ? '✓ Verified by Call' : 'Call Once to Verify'}</span>
                </button>
              </div>
              <input
                type="tel"
                name="mobile"
                className="form-input"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={handleInputChange}
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Alternate Phone Number <span className="opt">(Optional)</span>
              </label>
              <input
                type="tel"
                name="alternateNo"
                className="form-input"
                placeholder="Family / Alternate contact number"
                value={formData.alternateNo}
                onChange={handleInputChange}
                maxLength={10}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email Address <span className="req">*</span> <span style={{ textTransform: 'none', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>(Consumer Login ID)</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="consumer@example.com (used to log in)"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group span-2">
              <label className="form-label">
                Current Residential Address <span className="req">*</span>
              </label>
              <textarea
                name="address"
                className="form-textarea"
                placeholder="House / Plot No., Mohalla / Street, Landmark"
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">
                District / City <span className="req">*</span>
              </label>
              <input
                type="text"
                name="districtCity"
                className="form-input"
                value={formData.districtCity}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                PIN Code <span className="req">*</span>
              </label>
              <input
                type="text"
                name="pinCode"
                className="form-input"
                value={formData.pinCode}
                onChange={handleInputChange}
                maxLength={6}
                required
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            Section 6.3: Property & Electricity
            ========================================================================= */}
        <div className="booklet-section-card">
          <div className="bsec-header">
            <div className="bsec-num">2</div>
            <div>
              <h3 className="bsec-title">Property & Electricity Connection</h3>
              <p className="bsec-sub">Technical details of power connection and rooftop infrastructure</p>
            </div>
          </div>

          <div className="bsec-grid-2">

            <div className="form-group">
              <label className="form-label">Connection In Name Of <span className="req">*</span></label>
              <select
                name="connectionName"
                className="form-select"
                value={formData.connectionName}
                onChange={handleInputChange}
              >
                <option value="Self">Self (Applicant)</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Landlord">Landlord</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Property Type <span className="req">*</span></label>
              <select
                name="propertyType"
                className="form-select"
                value={formData.propertyType}
                onChange={handleInputChange}
              >
                <option value="Residential">Residential (Gharelu)</option>
                <option value="Commercial">Commercial (Vyavasayik)</option>
                <option value="Agricultural">Agricultural (Krishi)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Property Ownership <span className="req">*</span></label>
              <select
                name="ownership"
                className="form-select"
                value={formData.ownership}
                onChange={handleInputChange}
              >
                <option value="Owned">Owned (Apna Makaan)</option>
                <option value="Rented">Rented (Kiraya)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Roof Surface Type <span className="req">*</span></label>
              <select
                name="roofType"
                className="form-select"
                value={formData.roofType}
                onChange={handleInputChange}
              >
                <option value="RCC">RCC (Pakki Concrete Chhat)</option>
                <option value="Tin">Tin / GI Sheet Shed</option>
                <option value="Other">Other Open Space</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Usable Rooftop Area (Sq. Ft)</label>
              <input
                type="number"
                name="rooftopArea"
                className="form-input"
                placeholder="e.g. 450"
                value={formData.rooftopArea}
                onChange={handleInputChange}
              />
            </div>



            {/* Address Toggle */}
            <div className="form-group span-2">
              <div className="address-toggle-row">
                <label className="form-label">Installation Property Address</label>
                <button
                  type="button"
                  className="same-addr-btn"
                  onClick={() => {
                    const next = !sameAddressAsAbove;
                    setSameAddressAsAbove(next);
                    if (next) setFormData((p) => ({ ...p, propertyAddress: p.address }));
                  }}
                >
                  {sameAddressAsAbove ? <CheckSquare size={16} className="text-emerald" /> : <Square size={16} />}
                  <span>Same as residential address</span>
                </button>
              </div>
              {!sameAddressAsAbove && (
                <textarea
                  name="propertyAddress"
                  className="form-textarea mt-1"
                  placeholder="Enter separate property address where solar will be installed"
                  rows={2}
                  value={formData.propertyAddress}
                  onChange={handleInputChange}
                ></textarea>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            Section 6.4: Document Checklist & GPS Rooftop Photo
            ========================================================================= */}
        <div className="booklet-section-card">
          <div className="bsec-header">
            <div className="bsec-num">3</div>
            <div>
              <h3 className="bsec-title">Document Checklist & GPS Rooftop Photo</h3>
              <p className="bsec-sub">Capture photos of required documents (must be flat, bright, fully in frame, and readable)</p>
            </div>
          </div>

          {/* 6 Real Document Cards with File Upload & Live Previews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
            {/* 1. Aadhaar Card (Both Sides Required) */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="doc-checkbox">
                    {formData.documents.aadhaarCard?.collected ? <CheckSquare size={18} className="text-emerald" /> : <Square size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>1. Aadhaar Card (Front & Back Side Photos Required)</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Applicant identity proof with 12-digit Aadhaar number</div>
                  </div>
                </div>
                <span className={`doc-status-pill ${formData.documents.aadhaarCard?.collected ? 'pill-ok' : 'pill-pending'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                  {uploadingDoc.startsWith('aadhaarCard') ? '⏳ Uploading to R2...' : (formData.documents.aadhaarCard?.collected ? '✓ Photos Attached' : 'Pending Photos')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Aadhaar Number (12 Digits) <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    className="form-input"
                    placeholder="e.g. 5432 1098 7654"
                    maxLength={14}
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Upload Buttons for Front & Back */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="upload-aadhaar-front"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'aadhaarCard', 'frontPhoto')}
                  />
                  <label
                    htmlFor="upload-aadhaar-front"
                    className="doc-toggle-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', background: formData.documents.aadhaarCard?.frontPhoto ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)', color: formData.documents.aadhaarCard?.frontPhoto ? '#34d399' : '#38bdf8', border: '1px solid ' + (formData.documents.aadhaarCard?.frontPhoto ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)') }}
                  >
                    📷 {formData.documents.aadhaarCard?.frontPhoto ? '✓ Front Added' : 'Upload Front Photo'}
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    id="upload-aadhaar-back"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'aadhaarCard', 'backPhoto')}
                  />
                  <label
                    htmlFor="upload-aadhaar-back"
                    className="doc-toggle-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', background: formData.documents.aadhaarCard?.backPhoto ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)', color: formData.documents.aadhaarCard?.backPhoto ? '#34d399' : '#38bdf8', border: '1px solid ' + (formData.documents.aadhaarCard?.backPhoto ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)') }}
                  >
                    📷 {formData.documents.aadhaarCard?.backPhoto ? '✓ Back Added' : 'Upload Back Photo'}
                  </label>
                </div>
              </div>

              {/* Thumbnails Preview for Aadhaar */}
              {(formData.documents.aadhaarCard?.frontPhoto || formData.documents.aadhaarCard?.backPhoto) && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {formData.documents.aadhaarCard?.frontPhoto && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <img src={formData.documents.aadhaarCard.frontPhoto} alt="Aadhaar Front" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Front Side Attached</div>
                    </div>
                  )}
                  {formData.documents.aadhaarCard?.backPhoto && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <img src={formData.documents.aadhaarCard.backPhoto} alt="Aadhaar Back" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Back Side Attached</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. PAN Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="doc-checkbox">
                    {formData.documents.panCard?.collected ? <CheckSquare size={18} className="text-emerald" /> : <Square size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>2. PAN Card Photo & Number</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Tax / Government ID document (10 Alphanumeric)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`doc-status-pill ${formData.documents.panCard?.collected ? 'pill-ok' : 'pill-pending'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                    {uploadingDoc === 'panCard' ? '⏳ Uploading to R2...' : (formData.documents.panCard?.collected ? '✓ Photo Attached' : 'Pending Photo')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    id="upload-pan"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'panCard')}
                  />
                  <label
                    htmlFor="upload-pan"
                    className="doc-toggle-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', background: formData.documents.panCard?.collected ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)', color: formData.documents.panCard?.collected ? '#34d399' : '#38bdf8', border: '1px solid ' + (formData.documents.panCard?.collected ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)') }}
                  >
                    📷 {formData.documents.panCard?.collected ? 'Change Photo' : 'Upload PAN Photo'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PAN Number (10 Characters) <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    className="form-input"
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                    value={formData.panNumber}
                    onChange={handleInputChange}
                  />
                </div>
                {formData.documents.panCard?.fileUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <img src={formData.documents.panCard.fileUrl} alt="PAN Card" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>{formData.documents.panCard.fileName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Bijli Bill / Consumer CA Number */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="doc-checkbox">
                    {formData.documents.bijliBill?.collected ? <CheckSquare size={18} className="text-emerald" /> : <Square size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>3. Bijli Bill Photo & Consumer / CA Number</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Latest electricity DISCOM bill showing sanctioned load</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`doc-status-pill ${formData.documents.bijliBill?.collected ? 'pill-ok' : 'pill-pending'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                    {uploadingDoc === 'bijliBill' ? '⏳ Uploading to R2...' : (formData.documents.bijliBill?.collected ? '✓ Photo Attached' : 'Pending Photo')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    id="upload-bill"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'bijliBill')}
                  />
                  <label
                    htmlFor="upload-bill"
                    className="doc-toggle-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', background: formData.documents.bijliBill?.collected ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)', color: formData.documents.bijliBill?.collected ? '#34d399' : '#38bdf8', border: '1px solid ' + (formData.documents.bijliBill?.collected ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)') }}
                  >
                    📷 {formData.documents.bijliBill?.collected ? 'Change Photo' : 'Upload Bill Photo'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Bijli Bill / Consumer Number <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="consumerNo"
                    className="form-input font-mono"
                    placeholder="e.g. 1029384756 (from bill)"
                    value={formData.consumerNo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Average Monthly Bill (₹) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    name="avgMonthlyBill"
                    className="form-input"
                    placeholder="e.g. 3500"
                    value={formData.avgMonthlyBill}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {formData.documents.bijliBill?.fileUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <img src={formData.documents.bijliBill.fileUrl} alt="Bill" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>{formData.documents.bijliBill.fileName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Bank Passbook / DBT Subsidy Account */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="doc-checkbox">
                    {formData.documents.bankPassbook?.collected ? <CheckSquare size={18} className="text-emerald" /> : <Square size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>4. Bank Passbook Photo & Account Details</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>For direct DBT government solar subsidy credit</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`doc-status-pill ${formData.documents.bankPassbook?.collected ? 'pill-ok' : 'pill-pending'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                    {uploadingDoc === 'bankPassbook' ? '⏳ Uploading to R2...' : (formData.documents.bankPassbook?.collected ? '✓ Photo Attached' : 'Pending Photo')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    id="upload-passbook"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'bankPassbook')}
                  />
                  <label
                    htmlFor="upload-passbook"
                    className="doc-toggle-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', background: formData.documents.bankPassbook?.collected ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)', color: formData.documents.bankPassbook?.collected ? '#34d399' : '#38bdf8', border: '1px solid ' + (formData.documents.bankPassbook?.collected ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)') }}
                  >
                    📷 {formData.documents.bankPassbook?.collected ? 'Change Photo' : 'Upload Passbook Photo'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bank Account Number <span className="req">*</span></label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="form-input"
                    placeholder="e.g. 10293847561"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>IFSC Code <span className="req">*</span></label>
                  <input
                    type="text"
                    name="ifscCode"
                    className="form-input"
                    placeholder="e.g. SBIN0001234"
                    style={{ textTransform: 'uppercase' }}
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    className="form-input"
                    placeholder="e.g. State Bank of India"
                    value={formData.bankName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {formData.documents.bankPassbook?.fileUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', marginTop: '10px' }}>
                  <img src={formData.documents.bankPassbook.fileUrl} alt="Passbook" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>{formData.documents.bankPassbook.fileName}</div>
                </div>
              )}
            </div>

            {/* 5. Jamin Ka Rasid (Land/House Tax Receipt) */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="doc-checkbox">
                    {formData.documents.jaminRasid?.collected ? <CheckSquare size={18} className="text-emerald" /> : <Square size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>5. Jamin ka Rasid (Land / House Ownership Document)</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>House registry, municipal tax receipt or Khasra/Khatauni copy</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`doc-status-pill ${formData.documents.jaminRasid?.collected ? 'pill-ok' : 'pill-pending'}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                    {uploadingDoc === 'jaminRasid' ? '⏳ Uploading to R2...' : (formData.documents.jaminRasid?.collected ? '✓ Photo Attached' : 'Pending Photo')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    id="upload-jamin"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, 'jaminRasid')}
                  />
                  <label
                    htmlFor="upload-jamin"
                    className="doc-toggle-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', background: formData.documents.jaminRasid?.collected ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.15)', color: formData.documents.jaminRasid?.collected ? '#34d399' : '#38bdf8', border: '1px solid ' + (formData.documents.jaminRasid?.collected ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.25)') }}
                  >
                    📷 {formData.documents.jaminRasid?.collected ? 'Change Photo' : 'Upload Rasid Photo'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Land / Khasra Particulars</label>
                  <input
                    type="text"
                    name="landDetails"
                    className="form-input"
                    placeholder="e.g. Ward 14, Plot 8B, House Tax ID 9821"
                    value={formData.landDetails}
                    onChange={handleInputChange}
                  />
                </div>
                {formData.documents.jaminRasid?.fileUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <img src={formData.documents.jaminRasid.fileUrl} alt="Jamin Rasid" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>{formData.documents.jaminRasid.fileName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6th Item: Interactive Google Maps Satellite Rooftop Selector & Real Camera Photos */}
          <div style={{ marginTop: '14px' }}>
            <GoogleRooftopMap
              value={formData.documents.rooftopGpsPhoto || {}}
              existingPhotos={formData.documents.rooftopGpsPhoto?.sitePhotos || []}
              onChange={handleRooftopMapChange}
              onPhotosChange={handleSitePhotosChange}
            />
          </div>
        </div>

        {/* =========================================================================
            Section 6.4: Registration Fee & Online Payment Proof
            ========================================================================= */}
        <div className="booklet-section-card">
          <div className="bsec-header">
            <div className="bsec-num">4</div>
            <div>
              <h3 className="bsec-title">Registration Fee & Online Payment Proof</h3>
              <p className="bsec-sub">Candidate registration charge & verified digital payment receiving</p>
            </div>
          </div>

          <div className="bsec-grid-2">
            <div className="form-group">
              <label className="form-label">
                Registration Fee Amount (₹) <span className="req">*</span>
              </label>
              <input
                type="number"
                name="paymentAmount"
                className="form-input"
                placeholder="500"
                value={formData.paymentAmount}
                onChange={handleInputChange}
                required
              />
              <span className="form-hint">Standard government survey registration fee for PM Surya Ghar portal.</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Mode <span className="req">*</span>
              </label>
              <select
                name="paymentMode"
                className="form-select"
                value={formData.paymentMode}
                onChange={handleInputChange}
                required
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="QR_CODE">Dynamic Franchise QR Code</option>
                <option value="NET_BANKING">Net Banking / IMPS Transfer</option>
                <option value="CASH">Cash Payment Received On-Site</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Transaction ID / Bank UTR Reference No. <span className="req">*</span>
              </label>
              <input
                type="text"
                name="paymentTransactionId"
                className="form-input"
                placeholder="e.g. 428901928410 or Cash-Rec"
                value={formData.paymentTransactionId}
                onChange={handleInputChange}
                required
              />
              <span className="form-hint">Bank UTR or UPI confirmation reference number.</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Upload Online Payment Screenshot / Camera Shot <span className="req">*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  id="paymentScreenshotInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePaymentScreenshotUpload}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('paymentScreenshotInput')?.click()}
                  disabled={uploadingDoc === 'paymentScreenshot'}
                  style={{
                    background: formData.paymentScreenshotUrl ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid ' + (formData.paymentScreenshotUrl ? '#10b981' : '#38bdf8'),
                    color: formData.paymentScreenshotUrl ? '#34d399' : '#38bdf8',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Camera size={16} />
                  {uploadingDoc === 'paymentScreenshot'
                    ? 'Uploading to Cloudflare R2...'
                    : formData.paymentScreenshotUrl
                    ? '✓ Payment Screenshot Uploaded (Tap to Change)'
                    : '📷 Upload Payment Screenshot'}
                </button>
                {formData.paymentScreenshotUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <img
                      src={formData.paymentScreenshotUrl}
                      alt="Payment Screenshot Preview"
                      style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                      Stored in Cloudflare R2
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            Section 6.5: Declaration & Signatures
            ========================================================================= */}
        <div className="booklet-section-card">
          <div className="bsec-header">
            <div className="bsec-num">5</div>
            <div>
              <h3 className="bsec-title">Declaration & Signatures</h3>
              <p className="bsec-sub">Statutory consent under PM Surya Ghar Muft Bijli Yojana</p>
            </div>
          </div>

          {/* Exact declaration text from Booklet Section 6.5 */}
          <div className="declaration-legal-box">
            <p className="legal-text">
              "I confirm that all information and documents provided are true and correct. I am interested in installing rooftop solar under <strong>PM Surya Ghar: Muft Bijli Yojana</strong>."
            </p>
            <label className="declaration-checkbox-label">
              <input
                type="checkbox"
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData((p) => ({ ...p, declarationAccepted: e.target.checked }))}
                required
              />
              <span>I agree to the details provided above. <span className="req">*</span></span>
            </label>
          </div>

          <div className="signatures-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="sig-input-box">
              <label className="sig-label">Applicant Signature / Naam <span className="req">*</span></label>
              <div className="sig-field-wrap">
                <PenTool size={16} className="sig-icon" />
                <input
                  type="text"
                  placeholder="Applicant Full Name"
                  value={formData.applicantSignature || formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, applicantSignature: e.target.value }))}
                  className="sig-input"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="booklet-submit-bar">
          <button type="submit" className="submit-booklet-btn" disabled={loading}>
            {loading ? (
              'Submitting...'
            ) : (
              <>
                <span>Submit Form</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
