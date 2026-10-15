import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import SchemeFormulaSection from '../components/SchemeFormulaSection';
import BenefitsSection from '../components/BenefitsSection';
import StepsSection from '../components/StepsSection';
import QuickConnectionSection from '../components/QuickConnectionSection';
import SolarCalculator from '../components/SolarCalculator';
import FieldRegistrationModal from '../components/FieldRegistrationModal';
import TearOffSlip from '../components/TearOffSlip';
import FieldGuideModal from '../components/FieldGuideModal';
import TrackStatusModal from '../components/TrackStatusModal';
import Footer from '../components/Footer';
import { FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { translations } from '../translations';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { currentUser, logoutUser } = useAuth();

  // Language state
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('solar_lang') || 'hi';
    } catch {
      return 'hi';
    }
  });

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      try {
        localStorage.setItem('solar_lang', next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const t = translations[lang] || translations.hi;

  // View state: 'form' | 'slip'
  const [currentView, setCurrentView] = useState('form');
  const [activeSlipRegistration, setActiveSlipRegistration] = useState(null);

  // Modals
  const [isFieldGuideOpen, setIsFieldGuideOpen] = useState(false);
  const [isFieldFormModalOpen, setIsFieldFormModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [prefilledTrackId, setPrefilledTrackId] = useState('');

  const handleScrollToFieldForm = () => {
    const el = document.getElementById('digital-booklet-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleOpenTrackWithId = (regId = '') => {
    setPrefilledTrackId(regId);
    setIsTrackModalOpen(true);
  };

  const handleSuccessSubmit = (savedRegistration) => {
    setActiveSlipRegistration(savedRegistration);
    setCurrentView('slip');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`solar-app lang-${lang}`}>
      {/* Top Dynamic Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLanguage}
        t={t}
        currentUser={currentUser}
        onLogout={logoutUser}
        onOpenTrackModal={() => setIsTrackModalOpen(true)}
        onRegisterClick={handleScrollToFieldForm}
      />

      <main className="main-content">
        {currentView === 'form' && (
          <>
            {/* 1. Hero Section */}
            <HeroSection
              lang={lang}
              t={t}
              onRegisterClick={handleScrollToFieldForm}
              onScrollToCalc={() => {
                const el = document.getElementById('calculator');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />

            {/* 2. Scheme Formula Section */}
            <SchemeFormulaSection
              lang={lang}
              t={t}
              onRegisterClick={handleScrollToFieldForm}
            />

            {/* 3. Benefits Section */}
            <BenefitsSection
              lang={lang}
              t={t}
              onRegisterClick={handleScrollToFieldForm}
            />

            {/* 4. 3 Easy Steps Section */}
            <StepsSection
              lang={lang}
              t={t}
              onRegisterClick={handleScrollToFieldForm}
            />

            {/* 5. Quick Connection Section */}
            <QuickConnectionSection
              lang={lang}
              t={t}
              onTrackOpen={handleOpenTrackWithId}
            />

            {/* 6. Embedded Solar Savings Calculator */}
            <div className="section-container" style={{ margin: '40px auto 20px auto' }}>
              <SolarCalculator 
                onSelectMode={() => handleScrollToFieldForm()} 
              />
            </div>

            {/* 7. Detailed Digital Booklet Form Trigger Section */}
            <div id="digital-booklet-form" className="section-container" style={{ margin: '40px auto 60px auto' }}>
              <div className="field-form-trigger-card">
                <div className="ff-trigger-glow"></div>
                <div className="ff-trigger-content">
                  <div className="ff-trigger-badge">
                    <ShieldCheck size={16} className="text-emerald" />
                    <span>{lang === 'hi' ? 'आधिकारिक डिजिटल बुकलेट' : 'Official Digital Booklet'}</span>
                  </div>

                  <h3 className="ff-trigger-title">
                    {lang === 'hi' ? 'फील्ड रजिस्ट्रेशन फॉर्म' : 'Field Registration Form'}
                  </h3>

                  <p className="ff-trigger-desc">
                    {lang === 'hi' 
                      ? 'पीएम सूर्य घर मुफ्त बिजली योजना का संपूर्ण आधिकारिक फील्ड फॉर्म (Aadhaar, बिजली बिल, GPS रूफटॉप फोटो एवं स्लिप) भरने के लिए नीचे बटन पर क्लिक करें।'
                      : 'Complete official field registration form with Aadhaar, electricity bill verification, and GPS rooftop survey.'}
                  </p>

                  <div className="ff-trigger-actions">
                    <button
                      type="button"
                      className="field-form-open-btn"
                      onClick={() => setIsFieldFormModalOpen(true)}
                    >
                      <FileText size={20} />
                      <span>
                        {lang === 'hi' ? '📋 संपूर्ण रजिस्ट्रेशन फॉर्म खोलें' : '📋 Open Field Registration Form'}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                    
                    <button
                      type="button"
                      className="field-guide-open-btn"
                      onClick={() => setIsFieldGuideOpen(true)}
                    >
                      <span>{lang === 'hi' ? '📖 6-स्टेप फील्ड गाइड देखें' : '📖 View 6-Step Guide'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* View 2: Tear-Off Slip / Receipt View */}
        {currentView === 'slip' && activeSlipRegistration && (
          <div className="portal-container">
            <TearOffSlip
              registration={activeSlipRegistration}
              onClose={() => setCurrentView('form')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer lang={lang} t={t} />

      {/* Modals */}
      <FieldGuideModal
        isOpen={isFieldGuideOpen}
        onClose={() => setIsFieldGuideOpen(false)}
        lang={lang}
        t={t}
      />

      <FieldRegistrationModal
        isOpen={isFieldFormModalOpen}
        onClose={() => setIsFieldFormModalOpen(false)}
        onSuccess={handleSuccessSubmit}
        executiveData={{
          name: currentUser?.fullName || 'Online Applicant',
          id: currentUser?.executiveId || 'EX-ONLINE',
        }}
      />

      <TrackStatusModal
        isOpen={isTrackModalOpen}
        onClose={() => {
          setIsTrackModalOpen(false);
          setPrefilledTrackId('');
        }}
        lang={lang}
        prefilledId={prefilledTrackId}
      />
    </div>
  );
}
