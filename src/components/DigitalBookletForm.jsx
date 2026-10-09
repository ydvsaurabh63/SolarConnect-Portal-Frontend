import React, { useState, useEffect } from 'react';
import { 
  FileText, User, Phone, MapPin, Building, Home, 
  CheckSquare, Square, Camera, Upload, ShieldCheck, 
  ArrowRight, PhoneCall, CheckCircle2, AlertCircle, 
  Sparkles, PenTool, Calendar, Shield, IndianRupee,
  Lock, UserPlus, LogIn
} from 'lucide-react';
import { api } from '../services/api';

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
    email: currentUser?.email || '',
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
        email: prev.email || currentUser.email,
        executiveSignature: currentUser.fullName ? 'Verified by ' + currentUser.fullName : prev.executiveSignature,
      }));
    }
  }, [currentUser]);

  // Fetch next sequential ID from backend
  useEffect(() => {
    async function fetchNextId() {
      try {
        const res = await api.getNextId();
        if (res.success && res.nextId) {
          setRegId(res.nextId);
          setFormData((prev) => ({ ...prev, registrationId: res.nextId }));
        }
      } catch (e) {
        console.warn(e);
      }
    }
    fetchNextId();
  }, []);

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
        areaDistrict: formData.areaDistrict || formData.districtCity || 'General',
        propertyAddress: sameAddressAsAbove ? formData.address : formData.propertyAddress,
        applicantSignature: formData.applicantSignature || formData.fullName,
      };

      const res = await api.submitRegistration(payload);
      if (res.success && res.registration) {
        // Automatically fetch next incremented ID and reset form for subsequent candidate submissions
        const updatedNextId = await fetchNextRegId();
        setFormData({
          registrationId: updatedNextId || 'SC-0002',
          executiveName: currentUser?.fullName || '',
          executiveId: currentUser?.executiveId || '',
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
          onSuccessSubmit(res.registration);
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
      {/* Booklet Meta Bar */}
      <div className="booklet-top-bar">
        <div className="booklet-brand-pill">
          <ShieldCheck size={16} className="text-emerald" />
          <span>PM SURYA GHAR: MUFT BIJLI YOJANA</span>
        </div>
        <div className="booklet-guide-trigger">
          <button type="button" className="guide-hint-btn" onClick={onOpenFieldGuide}>
            📖 View 6-Step Field Guide (Meet, Fill, Collect...)
          </button>
        </div>
      </div>

      <div className="booklet-header-card">
        <div className="bh-left">
          <div className="bh-reg-badge">
            <span className="reg-badge-label">BOOKLET REGISTRATION ID</span>
            <span className="reg-badge-id font-mono">{regId}</span>
          </div>
          <div>
            <h2 className="bh-title">Field Registration Form</h2>
            <p className="bh-sub">Registration of Interested Candidates for Rooftop Solar Installation</p>
          </div>
        </div>

        <div className="bh-right">
          <div className="bh-meta-field">
            <span>Executive ID:</span>
            <strong>{formData.executiveId}</strong>
          </div>
          <div className="bh-meta-field">
            <span>Area / District:</span>
            <strong>{formData.areaDistrict}</strong>
          </div>
          <div className="bh-meta-field">
            <span>Issued On:</span>
            <strong>{formData.issuedOn}</strong>
          </div>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="booklet-main-form">
        {/* Section 6.1: Mode Selector */}
        <div className="form-mode-switch-card">
          <span className="mode-switch-label">Registration Carried Out By:</span>
          <div className="mode-toggle-group">
            <button
              type="button"
              className={`mode-toggle-btn ${formData.submissionMode === 'FIELD_EXECUTIVE' ? 'active' : ''}`}
              onClick={() => setFormData((p) => ({ ...p, submissionMode: 'FIELD_EXECUTIVE' }))}
            >
              Field Executive Assisted
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${formData.submissionMode === 'SELF_APPLICANT' ? 'active' : ''}`}
              onClick={() => setFormData((p) => ({ ...p, submissionMode: 'SELF_APPLICANT', executiveName: 'Self Applicant', executiveId: 'ONLINE-USER' }))}
            >
              Direct Self Applicant
            </button>
          </div>
        </div>

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
                Email Address <span className="opt">(Optional)</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="candidate@example.com"
                value={formData.email}
                onChange={handleInputChange}
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
              <label className="form-label">
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

            <div className="form-group">
              <label className="form-label">
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

            <div className="form-group">
              <label className="form-label">Jamin / Property Particulars <span className="opt">(Khasra / Khatauni)</span></label>
              <input
                type="text"
                name="landDetails"
                className="form-input"
                placeholder="e.g. Khasra 441, Ward 12"
                value={formData.landDetails}
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

          {/* 5 Documents List */}
          <div className="docs-checklist-grid">
            {[
              { key: 'aadhaarCard', title: '1. Aadhaar Card', note: 'Applicant proof of identity' },
              { key: 'panCard', title: '2. PAN Card', note: 'Tax / Identity document' },
              { key: 'bijliBill', title: '3. Bijli Bill / Consumer Bill', note: 'Latest electricity connection bill' },
              { key: 'bankPassbook', title: '4. Bank Passbook', note: 'For DBT subsidy bank account credit' },
              { key: 'jaminRasid', title: '5. Jamin ka Rasid (Land/House Tax)', note: 'Ownership verification document' },
            ].map((doc) => {
              const isCol = formData.documents[doc.key]?.collected;
              return (
                <div key={doc.key} className={`doc-check-item ${isCol ? 'collected' : ''}`}>
                  <div className="doc-check-left" onClick={() => handleDocToggle(doc.key)}>
                    <div className="doc-checkbox">
                      {isCol ? <CheckSquare size={18} className="text-emerald" /> : <Square size={18} />}
                    </div>
                    <div>
                      <strong className="doc-name">{doc.title}</strong>
                      <span className="doc-note">{doc.note}</span>
                    </div>
                  </div>
                  <div className="doc-action-right">
                    <span className={`doc-status-pill ${isCol ? 'pill-ok' : 'pill-pending'}`}>
                      {isCol ? '✓ Photo Collected' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      className="doc-toggle-btn"
                      onClick={() => handleDocToggle(doc.key)}
                    >
                      {isCol ? 'Change' : 'Mark Collected'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6th Item: Rooftop Photo - GPS Camera Banner */}
          <div className="gps-rooftop-card">
            <div className="gps-header">
              <div className="gps-icon-badge">
                <Camera size={24} className="text-amber" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="gps-title">6. Rooftop Photograph — GPS Camera ON</h4>
                <p className="gps-instruction">
                  Instruction: Capture imagery with <strong>GPS Camera ON</strong> showing open rooftop area, roof condition, and surrounding shadows. Must be flat, bright, and readable.
                </p>
              </div>
            </div>

            <div className="gps-status-box">
              {formData.documents.rooftopGpsPhoto.collected ? (
                <>
                  <div className="gps-tag">
                    <span className="live-dot"></span>
                    <span>GPS Telemetry Active: {formData.documents.rooftopGpsPhoto.gpsLatitude}, {formData.documents.rooftopGpsPhoto.gpsLongitude}</span>
                  </div>
                  <div className="gps-file-badge">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>{formData.documents.rooftopGpsPhoto.fileName}</span>
                    <button
                      type="button"
                      className="text-btn ml-2"
                      style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '0.5rem' }}
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          documents: {
                            ...p.documents,
                            rooftopGpsPhoto: {
                              collected: false,
                              fileName: '',
                              gpsLatitude: '',
                              gpsLongitude: '',
                              capturedWithGps: false,
                            },
                          },
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
                    Photo not yet captured.
                  </span>
                  <button
                    type="button"
                    className="doc-toggle-btn"
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '0.45rem 1rem' }}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        documents: {
                          ...p.documents,
                          rooftopGpsPhoto: {
                            collected: true,
                            fileName: 'gps_rooftop_survey_' + (p.consumerNo || 'site') + '.jpg',
                            gpsLatitude: '26.9124° N',
                            gpsLongitude: '75.7873° E',
                            capturedWithGps: true,
                          },
                        },
                      }))
                    }
                  >
                    📷 Capture / Upload GPS Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            Section 6.5: Declaration & Signatures
            ========================================================================= */}
        <div className="booklet-section-card">
          <div className="bsec-header">
            <div className="bsec-num">4</div>
            <div>
              <h3 className="bsec-title">Declaration & Signatures</h3>
              <p className="bsec-sub">Statutory consent under PM Surya Ghar Muft Bijli Yojana</p>
            </div>
          </div>

          {/* Exact declaration text from Booklet Section 6.5 */}
          <div className="declaration-legal-box">
            <p className="legal-text">
              "I declare that the information and documents provided are correct to the best of my knowledge. I am interested in exploring a solar installation under <strong>PM Surya Ghar: Muft Bijli Yojana</strong>, and agree to be contacted for assessment, eligibility verification and installation-related information. I understand that government subsidy is subject to eligibility verification and installation of approved equipment."
            </p>
            <label className="declaration-checkbox-label">
              <input
                type="checkbox"
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData((p) => ({ ...p, declarationAccepted: e.target.checked }))}
                required
              />
              <span>I hereby accept the applicant declaration above. <span className="req">*</span></span>
            </label>
          </div>

          <div className="signatures-grid">
            <div className="sig-input-box">
              <label className="sig-label">Applicant Digital Signature / Name Confirmation <span className="req">*</span></label>
              <div className="sig-field-wrap">
                <PenTool size={16} className="sig-icon" />
                <input
                  type="text"
                  placeholder="Type Full Legal Name as Signature"
                  value={formData.applicantSignature || formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, applicantSignature: e.target.value }))}
                  className="sig-input"
                  required
                />
              </div>
              <span className="sig-hint">Constitutes valid electronic signature under IT Act standards.</span>
            </div>

            <div className="sig-input-box">
              <label className="sig-label">Field Executive Verification Acknowledgement</label>
              <div className="sig-field-wrap locked">
                <ShieldCheck size={16} className="text-emerald" />
                <span className="sig-executive-text">
                  Signed & Authenticated by {formData.executiveName} ({formData.executiveId})
                </span>
              </div>
              <span className="sig-hint">Recorded automatically against Registration ID {regId}.</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="booklet-submit-bar">
          <button type="submit" className="submit-booklet-btn" disabled={loading}>
            {loading ? (
              'Transmitting Registration to Central Database...'
            ) : (
              <>
                <span>Submit Digital Registration & Generate Tear-Off Slip</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
