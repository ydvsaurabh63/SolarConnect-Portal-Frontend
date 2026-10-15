import React, { useState, useEffect } from 'react';
import PortalHeader from '../components/PortalHeader';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Wrench, CheckCircle2, Phone, MapPin, Check, Camera, ShieldCheck } from 'lucide-react';

export default function InstallerDashboard() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Complete installation modal
  const [completeApp, setCompleteApp] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState('INV-5KW-2026-X88 / PNL-545W-1to6');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getSubmissionLog();
      if (res.success) {
        setJobs(res.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!completeApp) return;
    await api.installerComplete(completeApp._id, serialNumbers, 'proof_installed.jpg');
    setCompleteApp(null);
    loadJobs();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <PortalHeader title="Certified Field Installation Terminal" roleBadge="Solar Installer" badgeColor="#7c3aed" />

      <main style={{ maxWidth: '1350px', margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Assigned Rooftop Work Orders</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Mount solar modules, wire inverters, execute earth pitting, and record serial numbers for commissioning.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {jobs.map((job) => {
            const isDone = job.installerDetails?.status === 'Completed' || job.verification?.status === 'Done';

            return (
              <div
                key={job._id}
                style={{
                  background: '#1e293b',
                  border: `1px solid ${isDone ? '#10b98150' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{job.registrationId}</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700 }}>{job.fullName}</h3>
                    </div>
                    <span
                      style={{
                        background: isDone ? '#10b98120' : '#7c3aed20',
                        color: isDone ? '#34d399' : '#a855f7',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {isDone ? 'COMPLETED' : 'WORK ORDER ALLOTTED'}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <MapPin size={15} color="#38bdf8" /> {job.propertyAddress || job.address}
                  </div>
                  <div style={{ fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <Phone size={15} /> Customer Contact: {job.mobile}
                  </div>

                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px' }}>
                    <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
                      <strong>Capacity:</strong> ~3.3 kW ({job.roofType || 'RCC'} Roof - {job.rooftopArea || 450} sq.ft)
                    </div>
                    <div style={{ color: '#94a3b8' }}>
                      <strong>EPC Partner:</strong> {job.partnerDetails?.partnerName || 'Central EPC Hub'}
                    </div>
                  </div>
                </div>

                <div>
                  {isDone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}>
                      <CheckCircle2 size={18} /> Installation Proofs Submitted & Verified
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCompleteApp(job);
                        setSerialNumbers('INV-5KW-2026-X88 / PNL-545W-1to6');
                      }}
                      style={{
                        width: '100%',
                        background: '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Check size={16} /> Mark Installation Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Complete Modal */}
      {completeApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700 }}>Record Solar Commissioning</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px' }}>
              Confirm rooftop structure installation for <strong>{completeApp.fullName}</strong> ({completeApp.registrationId}).
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Inverter & Panel Serial Numbers
              </label>
              <textarea
                rows={3}
                value={serialNumbers}
                onChange={(e) => setSerialNumbers(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setCompleteApp(null)}
                style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Submit Commissioning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
