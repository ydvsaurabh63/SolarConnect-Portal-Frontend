import React, { useState } from 'react';
import { Calculator, IndianRupee, Sun, Leaf, TreePine, Zap, ArrowRight, ShieldCheck, FileText, UserCheck } from 'lucide-react';

export default function SolarCalculator({ onSelectMode }) {
  const [monthlyBill, setMonthlyBill] = useState(4000);

  // Calculations
  const unitsPerMonth = Math.round(monthlyBill / 7.5);
  const systemSizeKw = Math.max(1, Math.round((unitsPerMonth / 120) * 10) / 10);
  const annualSavings = Math.round(monthlyBill * 12 * 0.88);
  const lifetimeSavingsLakhs = ((annualSavings * 25) / 100000).toFixed(1);
  const treesEquivalent = Math.round(systemSizeKw * 45);
  const co2ReductionTons = (systemSizeKw * 1.3).toFixed(1);

  // Subsidy calculations
  let subsidy = 78000;
  if (systemSizeKw <= 1.2) subsidy = 30000;
  else if (systemSizeKw <= 2.2) subsidy = 60000;

  return (
    <section id="calculator" className="calculator-section">
      <div className="section-header text-center">
        <span className="section-tag">INTERACTIVE ROOFTOP CALCULATOR</span>
        <h2 className="section-title">See How Much You Will Save With Solar</h2>
        <p className="section-subtitle">
          Adjust your current monthly electricity bill to see your recommended solar plant capacity, government subsidy, and lifetime savings.
        </p>
      </div>

      <div className="calculator-card">
        {/* Slider input */}
        <div className="calculator-slider-box">
          <div className="calc-slider-header">
            <span className="calc-label">Your Average Monthly Electricity Bill</span>
            <span className="calc-bill-value">₹{monthlyBill.toLocaleString('en-IN')} / month</span>
          </div>

          <input
            type="range"
            min="1000"
            max="30000"
            step="500"
            value={monthlyBill}
            onChange={(e) => setMonthlyBill(Number(e.target.value))}
            className="range-slider-big"
          />

          <div className="range-milestones">
            <span>₹1,000</span>
            <span>₹5,000</span>
            <span>₹15,000</span>
            <span>₹30,000+</span>
          </div>
        </div>

        {/* Results 4-card grid */}
        <div className="calc-results-grid">
          <div className="calc-result-box highlight-box">
            <div className="calc-result-icon"><Sun size={24} className="text-solar" /></div>
            <span className="calc-res-label">Recommended Capacity</span>
            <span className="calc-res-value text-emerald">{systemSizeKw} kW</span>
            <span className="calc-res-sub">Approx {Math.round(systemSizeKw * 100)} sq ft roof needed</span>
          </div>

          <div className="calc-result-box">
            <div className="calc-result-icon"><ShieldCheck size={24} className="text-amber" /></div>
            <span className="calc-res-label">Direct DBT Subsidy</span>
            <span className="calc-res-value text-amber">₹{subsidy.toLocaleString('en-IN')}</span>
            <span className="calc-res-sub">Credited directly to bank A/C</span>
          </div>

          <div className="calc-result-box">
            <div className="calc-result-icon"><IndianRupee size={24} className="text-emerald" /></div>
            <span className="calc-res-label">25-Year Lifetime Savings</span>
            <span className="calc-res-value">₹{lifetimeSavingsLakhs} Lakhs</span>
            <span className="calc-res-sub">Based on ₹{annualSavings.toLocaleString('en-IN')}/yr saved</span>
          </div>

          <div className="calc-result-box">
            <div className="calc-result-icon"><TreePine size={24} className="text-emerald" /></div>
            <span className="calc-res-label">Green Impact</span>
            <span className="calc-res-value">{treesEquivalent} Trees</span>
            <span className="calc-res-sub">{co2ReductionTons} tonnes CO₂ saved/yr</span>
          </div>
        </div>
      </div>
    </section>
  );
}
