import React, { useState } from 'react';
import { 
  X, FileText, UserCheck, Home, 
  ArrowRight, ArrowLeft, Briefcase, Sparkles, CheckCircle2 
} from 'lucide-react';
import DigitalBookletForm from './DigitalBookletForm';

export default function FieldRegistrationModal({
  isOpen,
  onClose,
  currentUser,
  onSuccessSubmit,
  onOpenFieldGuide,
  onOpenAuthModal,
  lang = 'hi',
}) {
  // Step 1 mode selection: null = show options first, 'FIELD_EXECUTIVE' | 'SELF_APPLICANT' = open form
  const [selectedMode, setSelectedMode] = useState(null);

  if (!isOpen) return null;

  // Handle closing modal and resetting choice
  const handleModalClose = () => {
    setSelectedMode(null);
    onClose();
  };

  // If user is not signed in, create a direct applicant session so form is fully usable
  const effectiveUser = currentUser || {
    fullName: selectedMode === 'FIELD_EXECUTIVE' 
      ? (lang === 'hi' ? 'फील्ड एग्जीक्यूटिव' : 'Field Executive')
      : (lang === 'hi' ? 'सीधा आवेदक (Direct Applicant)' : 'Direct Applicant'),
    email: selectedMode === 'FIELD_EXECUTIVE' 
      ? 'executive@solarconnect.in' 
      : 'direct.applicant@solarconnect.in',
    role: selectedMode === 'FIELD_EXECUTIVE' ? 'executive' : 'applicant',
    executiveId: selectedMode === 'FIELD_EXECUTIVE' ? 'EX-FIELD' : 'ONLINE-APPLICANT',
  };

  const handleSuccess = (registration) => {
    setSelectedMode(null);
    onClose();
    if (onSuccessSubmit) {
      onSuccessSubmit(registration);
    }
  };

  return (
    <div className="field-form-modal-overlay animate-fade-in" onClick={handleModalClose}>
      <div 
        className={`field-form-modal-content ${!selectedMode ? 'mode-select-compact-modal' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Floating Header */}
        <div className="field-modal-top-bar compact-top-bar">
          <div className="fmt-left">
            {selectedMode && (
              <button
                type="button"
                className="field-modal-back-btn"
                onClick={() => setSelectedMode(null)}
                title="Change Option"
              >
                <ArrowLeft size={15} />
                <span>{lang === 'hi' ? 'बदलें' : 'Back'}</span>
              </button>
            )}

            <div className="fmt-icon-box compact-icon-box">
              <FileText size={18} className="text-emerald" />
            </div>

            <div>
              <h3 className="fmt-title compact-title">
                {selectedMode 
                  ? (lang === 'hi' ? 'फील्ड रजिस्ट्रेशन फॉर्म' : 'Field Registration Form')
                  : (lang === 'hi' ? 'रजिस्ट्रेशन प्रकार चुनें' : 'Select Registration Mode')}
              </h3>
              <span className="fmt-sub compact-sub">
                PM Surya Ghar: Muft Bijli Yojana
              </span>
            </div>
          </div>

          <div className="fmt-right">
            {selectedMode && (
              <span className="fmt-active-mode-pill compact-mode-pill">
                {selectedMode === 'FIELD_EXECUTIVE' ? 'Executive' : 'Self Applicant'}
              </span>
            )}

            <button
              type="button"
              className="field-modal-close-btn compact-close-btn"
              onClick={handleModalClose}
              aria-label="Close"
            >
              <X size={18} />
              <span>{lang === 'hi' ? 'बंद' : 'Close'}</span>
            </button>
          </div>
        </div>

        {/* STEP 1: Compact, Sleek 2-Option Selection */}
        {!selectedMode ? (
          <div className="field-modal-scroll-body mode-select-modal-body compact-mode-body">
            <div className="mode-selection-wrapper compact-mode-wrapper">
              <p className="mss-compact-hint">
                {lang === 'hi' 
                  ? 'कृपया आगे बढ़ने के लिए उपयुक्त विकल्प पर क्लिक करें:' 
                  : 'Choose an option below to open the application form:'}
              </p>

              {/* Two Compact Interactive Choice Cards */}
              <div className="mode-cards-grid compact-cards-grid">
                {/* Option 1: Field Executive Assisted */}
                <div 
                  className="mode-choice-card mode-card-executive compact-choice-card"
                  onClick={() => setSelectedMode('FIELD_EXECUTIVE')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mcc-badge mcc-executive-badge compact-badge">
                    <Briefcase size={11} />
                    <span>Option 1</span>
                  </div>

                  <div className="mcc-icon-circle mcc-blue compact-icon-circle">
                    <UserCheck size={22} />
                  </div>

                  <h3 className="mcc-title compact-card-title">
                    Field Executive Assisted
                  </h3>
                  <span className="mcc-hindi-label compact-hindi-sub">
                    {lang === 'hi' ? '(फील्ड एग्जीक्यूटिव द्वारा)' : '(Surveyor Assisted)'}
                  </span>

                  <p className="mcc-desc compact-card-desc">
                    {lang === 'hi' 
                      ? 'फील्ड प्रतिनिधि द्वारा मौके पर रूफटॉप सर्वे व भौतिक सत्यापन।' 
                      : 'On-site survey assisted by authorized field surveyor with ID tag.'}
                  </p>

                  <div className="mcc-features-list compact-feats">
                    <div className="mcc-feat-item compact-feat-item">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>Executive ID & Survey</span>
                    </div>
                    <div className="mcc-feat-item compact-feat-item">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>GPS Rooftop Photos</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="mcc-select-btn mcc-btn-executive compact-select-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMode('FIELD_EXECUTIVE');
                    }}
                  >
                    <span>{lang === 'hi' ? 'यह विकल्प चुनें' : 'Select Mode'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Option 2: Direct Self Applicant */}
                <div 
                  className="mode-choice-card mode-card-self active-featured compact-choice-card"
                  onClick={() => setSelectedMode('SELF_APPLICANT')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mcc-badge mcc-self-badge compact-badge">
                    <Sparkles size={11} />
                    <span>Option 2 • Popular</span>
                  </div>

                  <div className="mcc-icon-circle mcc-green compact-icon-circle">
                    <Home size={22} />
                  </div>

                  <h3 className="mcc-title compact-card-title">
                    Direct Self Applicant
                  </h3>
                  <span className="mcc-hindi-label compact-hindi-sub">
                    {lang === 'hi' ? '(सीधा स्वयं आवेदक / उपभोक्ता)' : '(Homeowner Direct)'}
                  </span>

                  <p className="mcc-desc compact-card-desc">
                    {lang === 'hi' 
                      ? 'मकान मालिक या उपभोक्ता द्वारा 3-मिनट में सीधा ऑनलाइन आवेदन।' 
                      : 'Direct 3-minute online application without any intermediary.'}
                  </p>

                  <div className="mcc-features-list compact-feats">
                    <div className="mcc-feat-item compact-feat-item">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>Instant 3-Min Form</span>
                    </div>
                    <div className="mcc-feat-item compact-feat-item">
                      <CheckCircle2 size={13} className="text-emerald" />
                      <span>Direct DBT Bank Subsidy</span>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="mcc-select-btn mcc-btn-self compact-select-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMode('SELF_APPLICANT');
                    }}
                  >
                    <span>{lang === 'hi' ? 'यह विकल्प चुनें' : 'Select Mode'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Selected option is set, open the full digital booklet form */
          <div className="field-modal-scroll-body">
            <DigitalBookletForm
              currentUser={effectiveUser}
              onSuccessSubmit={handleSuccess}
              onOpenFieldGuide={onOpenFieldGuide}
              onOpenAuthModal={onOpenAuthModal}
              preferredFormMode={selectedMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
