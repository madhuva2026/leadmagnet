import React, { useState } from 'react';
import './index.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── helpers ────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const pct = (n) => `${n.toFixed(1)}%`;

function calculate(f) {
  const yearsToRetire = f.retireAge - f.currentAge;
  const yearsInRetire = f.lifeExpectancy - f.retireAge;
  const annualExpenses = f.monthlyExpenses * 12;
  const monthlyInvest = f.monthlyIncome - f.monthlyExpenses - f.monthlyEMI - f.parentsSupport;
  const inflFactor = Math.pow(1 + f.inflation / 100, yearsToRetire);
  const adjMonthly = f.monthlyExpenses * inflFactor;
  const corpusRequired = adjMonthly * 12 * 35;
  const fvSavings = f.currentSavings * Math.pow(1 + f.returnRate / 100, yearsToRetire);
  const rM = f.returnRate / 100 / 12;
  const months = yearsToRetire * 12;
  const fvSIP = f.monthlySIP * (((Math.pow(1 + rM, months) - 1) / rM) * (1 + rM));
  const totalCorpus = fvSavings + fvSIP;
  const gap = corpusRequired - totalCorpus;
  const progress = Math.min((totalCorpus / corpusRequired) * 100, 100);
  const emergTarget = f.monthlyExpenses * 12;
  const emergPct = Math.min((f.emergencyFund / emergTarget) * 100, 100);
  const emiPct = (f.monthlyEMI / f.monthlyIncome) * 100;
  const obligPct = ((f.monthlyEMI + f.parentsSupport) / f.monthlyIncome) * 100;
  const sipPct = monthlyInvest > 0 ? (f.monthlySIP / monthlyInvest) * 100 : 0;

  return {
    yearsToRetire, yearsInRetire, annualExpenses,
    monthlyInvest, inflFactor, adjMonthly,
    corpusRequired, fvSavings, fvSIP,
    totalCorpus, gap, progress,
    emergTarget, emergPct, emiPct, obligPct, sipPct,
  };
}

// ─── PDF Generation ─────────────────────────────────────
function generatePDF(form, result) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Helper function for formatting currency
  const formatCurrency = (n) => {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(245, 166, 35);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setFillColor(232, 115, 74);
  doc.rect(0, 35, pageWidth, 10, 'F');
  
  // Title
  doc.setTextColor(10, 15, 30);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Retirement Plan', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('A Comprehensive Financial Roadmap to Your Future', pageWidth / 2, 30, { align: 'center' });
  
  // Date
  doc.setFontSize(9);
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated on: ${today}`, pageWidth / 2, 38, { align: 'center' });

  // Reset text color for body
  doc.setTextColor(40, 40, 40);
  let yPos = 55;

  // Status Badge
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  if (result.gap <= 0) {
    doc.setTextColor(52, 211, 153);
    doc.text('✓ ON TRACK', pageWidth / 2, yPos, { align: 'center' });
  } else {
    doc.setTextColor(248, 113, 113);
    doc.text('⚠ NEEDS ATTENTION', pageWidth / 2, yPos, { align: 'center' });
  }
  
  yPos += 10;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statusText = result.gap <= 0 
    ? `Your projected corpus exceeds requirements by ${formatCurrency(Math.abs(result.gap))}`
    : `You need to close a gap of ${formatCurrency(result.gap)} to meet your retirement goals`;
  doc.text(statusText, pageWidth / 2, yPos, { align: 'center', maxWidth: 170 });

  yPos += 15;

  // Progress Circle (simulated)
  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(3);
  doc.circle(pageWidth / 2, yPos + 10, 15, 'S');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text(`${Math.round(result.progress)}%`, pageWidth / 2, yPos + 13, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Ready', pageWidth / 2, yPos + 19, { align: 'center' });

  yPos += 40;

  // Section: Personal Details
  doc.setFillColor(240, 244, 255);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text('👤 PERSONAL DETAILS', 20, yPos + 5.5);
  
  yPos += 12;
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Current Age', `${form.currentAge} years`],
      ['Retirement Age', `${form.retireAge} years`],
      ['Life Expectancy', `${form.lifeExpectancy} years`],
      ['Years to Retirement', `${result.yearsToRetire} years`],
      ['Years in Retirement', `${result.yearsInRetire} years`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [245, 166, 35], textColor: [10, 15, 30], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 15, right: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Section: Financial Overview
  doc.setFillColor(240, 244, 255);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text('💰 FINANCIAL OVERVIEW', 20, yPos + 5.5);
  
  yPos += 12;
  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount']],
    body: [
      ['Monthly Income', formatCurrency(form.monthlyIncome)],
      ['Monthly Expenses', formatCurrency(form.monthlyExpenses)],
      ['Monthly EMI', formatCurrency(form.monthlyEMI)],
      ['Parents Support', formatCurrency(form.parentsSupport)],
      ['Monthly Investable Surplus', formatCurrency(result.monthlyInvest)],
      ['Current Savings', formatCurrency(form.currentSavings)],
      ['Monthly SIP', formatCurrency(form.monthlySIP)],
      ['Emergency Fund', formatCurrency(form.emergencyFund)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [245, 166, 35], textColor: [10, 15, 30], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 15, right: 15 },
  });

  // Add new page
  doc.addPage();
  yPos = 20;

  // Section: Retirement Corpus Analysis
  doc.setFillColor(240, 244, 255);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text('📊 RETIREMENT CORPUS ANALYSIS', 20, yPos + 5.5);
  
  yPos += 12;
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Corpus Required at Retirement', formatCurrency(result.corpusRequired)],
      ['Future Value of Current Savings', formatCurrency(result.fvSavings)],
      ['Future Value of SIP', formatCurrency(result.fvSIP)],
      ['Total Projected Corpus', formatCurrency(result.totalCorpus)],
      [result.gap <= 0 ? 'Surplus' : 'Shortfall', formatCurrency(Math.abs(result.gap))],
    ],
    theme: 'striped',
    headStyles: { fillColor: [245, 166, 35], textColor: [10, 15, 30], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    bodyStyles: {
      0: { fontStyle: 'bold', fillColor: [255, 250, 240] },
      4: { fontStyle: 'bold', fillColor: result.gap <= 0 ? [220, 252, 231] : [254, 242, 242] }
    },
    margin: { left: 15, right: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Section: Inflation Impact
  doc.setFillColor(240, 244, 255);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text('📈 INFLATION IMPACT', 20, yPos + 5.5);
  
  yPos += 12;
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Current Monthly Expenses', formatCurrency(form.monthlyExpenses)],
      ['Adjusted Monthly Expenses at Retirement', formatCurrency(result.adjMonthly)],
      ['Inflation Rate Assumed', `${form.inflation}%`],
      ['Inflation Factor', `${result.inflFactor.toFixed(2)}x`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [245, 166, 35], textColor: [10, 15, 30], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 15, right: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Section: Financial Health Indicators
  doc.setFillColor(240, 244, 255);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text('💡 FINANCIAL HEALTH INDICATORS', 20, yPos + 5.5);
  
  yPos += 12;
  
  const getHealthStatus = (value, good, warn) => {
    if (value <= good) return '✓ Good';
    if (value <= warn) return '⚠ Fair';
    return '✗ Needs Improvement';
  };

  autoTable(doc, {
    startY: yPos,
    head: [['Indicator', 'Value', 'Status']],
    body: [
      ['EMI as % of Income', `${result.emiPct.toFixed(1)}%`, getHealthStatus(result.emiPct, 30, 40)],
      ['Total Obligations as % of Income', `${result.obligPct.toFixed(1)}%`, getHealthStatus(result.obligPct, 35, 50)],
      ['Emergency Fund Coverage', `${result.emergPct.toFixed(1)}%`, result.emergPct >= 80 ? '✓ Good' : result.emergPct >= 40 ? '⚠ Fair' : '✗ Needs Improvement'],
      ['SIP as % of Investable Surplus', `${result.sipPct.toFixed(1)}%`, result.sipPct >= 80 ? '✓ Good' : result.sipPct >= 40 ? '⚠ Fair' : '✗ Needs Improvement'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [245, 166, 35], textColor: [10, 15, 30], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 15, right: 15 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Recommendations Section
  doc.setFillColor(255, 250, 240);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 166, 35);
  doc.text('💼 RECOMMENDATIONS', 20, yPos + 5.5);
  
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const recommendations = [];
  
  if (result.gap > 0) {
    const additionalSIP = Math.ceil(result.gap / ((((Math.pow(1 + form.returnRate / 100 / 12, result.yearsToRetire * 12) - 1) / (form.returnRate / 100 / 12)) * (1 + form.returnRate / 100 / 12))));
    recommendations.push(`• Increase your monthly SIP by ${formatCurrency(additionalSIP)} to close the retirement gap.`);
  }
  
  if (result.emergPct < 100) {
    recommendations.push(`• Build your emergency fund to ${formatCurrency(result.emergTarget)} (12 months of expenses).`);
  }
  
  if (result.emiPct > 40) {
    recommendations.push(`• Your EMI is ${result.emiPct.toFixed(1)}% of income. Consider reducing debt burden below 40%.`);
  }
  
  if (result.sipPct < 50 && result.monthlyInvest > 0) {
    recommendations.push(`• You're investing ${result.sipPct.toFixed(1)}% of your surplus. Consider increasing SIP allocation.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('• Excellent! Your retirement plan is on track. Continue with your current strategy.');
    recommendations.push('• Review your plan annually and adjust for life changes.');
  }

  recommendations.forEach((rec, idx) => {
    const lines = doc.splitTextToSize(rec, pageWidth - 40);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 5 + 2;
  });

  // Footer
  yPos = pageHeight - 25;
  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('⚠️ Disclaimer: This report provides illustrative planning estimates and is not financial advice.', pageWidth / 2, yPos, { align: 'center' });
  doc.text('Please consult a SEBI-registered investment advisor for personalized guidance.', pageWidth / 2, yPos + 4, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated by Retirement Readiness Calculator | ${today}`, pageWidth / 2, yPos + 10, { align: 'center' });

  // Save the PDF
  doc.save(`Retirement_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── sub-components ─────────────────────────────────────
function Field({ label, prefix, suffix, value, onChange, min, max, step = 1 }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className={`input-wrap ${prefix ? 'has-prefix' : ''} ${suffix ? 'has-suffix' : ''}`}>
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, suffix }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="range-wrap">
        <span className="range-display">{value}{suffix}</span>
        <input
          type="range"
          value={value} min={min} max={max} step="0.5"
          onChange={e => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function HealthBar({ label, value, maxVal, good, warn }) {
  const pctVal = Math.min((value / maxVal) * 100, 100);
  const cls = value <= good ? 'bar-good' : value <= warn ? 'bar-warn' : 'bar-bad';
  return (
    <div className="health-bar-row">
      <div className="health-bar-header">
        <span className="health-bar-label">{label}</span>
        <span className="health-bar-val" style={{ color: value <= good ? 'var(--green)' : value <= warn ? '#fbbf24' : 'var(--red)' }}>
          {pct(value)}
        </span>
      </div>
      <div className="health-bar-bg">
        <div className={`health-bar-fill ${cls}`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

function ProgressBar({ label, value, suffix = '%' }) {
  const cls = value >= 80 ? 'bar-good' : value >= 40 ? 'bar-warn' : 'bar-bad';
  return (
    <div className="health-bar-row">
      <div className="health-bar-header">
        <span className="health-bar-label">{label}</span>
        <span className="health-bar-val">{value.toFixed(1)}{suffix}</span>
      </div>
      <div className="health-bar-bg">
        <div className={`health-bar-fill ${cls}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function DonutRing({ progress }) {
  const r = 58, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <div className="progress-ring-wrap" style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5a623" />
            <stop offset="100%" stopColor="#e8734a" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx={cx} cy={cy} r={r} />
        <circle
          className="ring-fg"
          cx={cx} cy={cy} r={r}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={0}
        />
      </svg>
      <div className="ring-label" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="ring-pct">{Math.round(progress)}%</span>
        <span className="ring-sub">Ready</span>
      </div>
    </div>
  );
}

// ─── main app ───────────────────────────────────────────
const DEFAULTS = {
  currentAge: 30, retireAge: 60, lifeExpectancy: 85,
  monthlyIncome: 150000, monthlyExpenses: 40000,
  monthlyEMI: 25000, parentsSupport: 10000,
  currentSavings: 1500000, monthlySIP: 25000,
  emergencyFund: 200000, returnRate: 12, inflation: 6,
};

export default function App() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState('input');

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handleCalc = () => {
    if (form.retireAge <= form.currentAge) return alert('Retirement age must be greater than current age');
    if (form.lifeExpectancy <= form.retireAge) return alert('Life expectancy must be greater than retirement age');
    setResult(calculate(form));
    setPage('results');
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-brand">Retirement Readiness</div>
        <div className="topbar-note">Financial Planner</div>
      </div>

      <div className="header">
        <div className="step-label">{page === 'input' ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}</div>
        <h1>{page === 'input' ? 'Your Retirement Readiness Score' : 'Your Retirement Score'}</h1>
        <p>
          {page === 'input'
            ? "Answer a few questions about your finances and we'll generate a complete retirement scorecard you can download as a PDF."
            : 'Review your retirement outlook, savings gap, and key metrics to plan your future.'}
        </p>
      </div>

      <div className="container">
        <div className="page-nav">
          <button className={`page-step ${page === 'input' ? 'active' : ''}`} onClick={() => setPage('input')}>
            1. Inputs
          </button>
          <button className={`page-step ${page === 'results' ? 'active' : ''}`} disabled={!result} onClick={() => result && setPage('results')}>
            2. Results
          </button>
        </div>

        {page === 'input' ? (
          <div className="grid-1">
            <div>
              {/* Personal */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-title"><span className="card-title-icon">👤</span>Personal Details</div>
                <div className="field-row">
                  <Field label="Current Age" value={form.currentAge} onChange={set('currentAge')} min={18} max={80} suffix="yrs" />
                  <Field label="Retirement Age" value={form.retireAge} onChange={set('retireAge')} min={40} max={80} suffix="yrs" />
                </div>
                <Field label="Life Expectancy" value={form.lifeExpectancy} onChange={set('lifeExpectancy')} min={60} max={100} suffix="yrs" />
              </div>

              {/* Income & Expenses */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-title"><span className="card-title-icon">💰</span>Income & Expenses</div>
                <Field label="Monthly Income" prefix="₹" value={form.monthlyIncome} onChange={set('monthlyIncome')} min={0} />
                <Field label="Monthly Household Expenses" prefix="₹" value={form.monthlyExpenses} onChange={set('monthlyExpenses')} min={0} />
                <div className="field-row">
                  <Field label="Monthly EMI" prefix="₹" value={form.monthlyEMI} onChange={set('monthlyEMI')} min={0} />
                  <Field label="Parents' Support" prefix="₹" value={form.parentsSupport} onChange={set('parentsSupport')} min={0} />
                </div>
              </div>

              {/* Savings & SIP */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-title"><span className="card-title-icon">📈</span>Savings & Investments</div>
                <Field label="Total Savings Today" prefix="₹" value={form.currentSavings} onChange={set('currentSavings')} min={0} />
                <Field label="Current Monthly SIP" prefix="₹" value={form.monthlySIP} onChange={set('monthlySIP')} min={0} />
                <Field label="Emergency Fund" prefix="₹" value={form.emergencyFund} onChange={set('emergencyFund')} min={0} />
              </div>

              {/* Rate assumptions */}
              <div className="card">
                <div className="card-title"><span className="card-title-icon">⚙️</span>Rate Assumptions</div>
                <SliderField label="Expected Annual Return" value={form.returnRate} onChange={set('returnRate')} min={4} max={20} suffix="%" />
                <SliderField label="Expected Inflation" value={form.inflation} onChange={set('inflation')} min={2} max={12} suffix="%" />
              </div>

              <button className="btn-calculate" onClick={handleCalc}>
                Get Your Retirement Score →
              </button>
            </div>
          </div>
        ) : (
          <div className="results-page">
            <button className="btn-secondary" onClick={() => setPage('input')}>
              ← Edit Inputs
            </button>

            <div className="results">
              {/* Hero */}
              <div className="hero-result">
                <DonutRing progress={result.progress} />
                <div className={`hero-status ${result.gap <= 0 ? 'on-track' : 'needs-work'}`}>
                  {result.gap <= 0 ? '🎉 On Track!' : '⚠️ Needs Attention'}
                </div>
                <div className="hero-desc">
                  {result.gap <= 0
                    ? `Your projected corpus of ${fmt(result.totalCorpus)} exceeds the required ${fmt(result.corpusRequired)}. You have a surplus of ${fmt(Math.abs(result.gap))}.`
                    : `You need ${fmt(result.corpusRequired)} but are projected to have ${fmt(result.totalCorpus)}. Close the ${fmt(result.gap)} gap by increasing your SIP.`}
                </div>
              </div>

              {/* Corpus metrics */}
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-label">Corpus Required</div>
                  <div className="metric-value">{fmt(result.corpusRequired)}</div>
                  <div className="metric-sub">35× annual expenses at retirement</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Total Projected Corpus</div>
                  <div className={`metric-value ${result.gap <= 0 ? 'positive' : 'negative'}`}>{fmt(result.totalCorpus)}</div>
                  <div className="metric-sub">Savings + SIP at {form.returnRate}% p.a.</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">FV of Savings</div>
                  <div className="metric-value positive">{fmt(result.fvSavings)}</div>
                  <div className="metric-sub">Current ₹{(form.currentSavings / 1e5).toFixed(1)}L grown</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">FV of SIP</div>
                  <div className="metric-value positive">{fmt(result.fvSIP)}</div>
                  <div className="metric-sub">₹{(form.monthlySIP / 1000).toFixed(0)}K/mo compounded</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Corpus Gap / Surplus</div>
                  <div className={`metric-value ${result.gap <= 0 ? 'positive' : 'negative'}`}>
                    {result.gap <= 0 ? '+' : '-'}{fmt(Math.abs(result.gap))}
                  </div>
                  <div className="metric-sub">{result.gap <= 0 ? 'Surplus' : 'Shortfall'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Monthly Investable Surplus</div>
                  <div className={`metric-value ${result.monthlyInvest > 0 ? 'positive' : 'negative'}`}>{fmt(result.monthlyInvest)}</div>
                  <div className="metric-sub">After all obligations</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-title"><span className="card-title-icon">🗓️</span>Timeline</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  {[
                    { v: result.yearsToRetire, l: 'Years to Retire' },
                    { v: result.yearsInRetire, l: 'Years in Retirement' },
                    { v: form.retireAge, l: 'Retirement Age' },
                  ].map(({ v, l }) => (
                    <div key={l}>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{v}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inflation */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-title"><span className="card-title-icon">📊</span>Inflation Impact</div>
                <div className="metric-grid">
                  <div>
                    <div className="metric-label">Today's Expenses</div>
                    <div className="metric-value">{fmt(form.monthlyExpenses)}<span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>/mo</span></div>
                  </div>
                  <div>
                    <div className="metric-label">At Retirement ({form.retireAge})</div>
                    <div className="metric-value" style={{ color: 'var(--accent)' }}>{fmt(result.adjMonthly)}<span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>/mo</span></div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.8rem' }}>
                  Inflation factor: <strong style={{ color: 'var(--text)' }}>{result.inflFactor.toFixed(2)}×</strong> at {form.inflation}% over {result.yearsToRetire} years
                </div>
              </div>

              {/* Financial Health */}
              <div className="health-section">
                <div className="health-title">💡 Financial Health Snapshot</div>
                <HealthBar label="EMI as % of Income" value={result.emiPct} maxVal={60} good={30} warn={40} />
                <HealthBar label="Total Obligations as % of Income" value={result.obligPct} maxVal={60} good={35} warn={50} />
                <ProgressBar label="Emergency Fund Coverage" value={result.emergPct} />
                <ProgressBar label="SIP as % of Investable Surplus" value={result.sipPct} />
              </div>

              <div className="disclaimer">
                ⚠️ Numbers are illustrative planning estimates. Not financial advice.<br />
                Consult a SEBI-registered investment advisor for personalised guidance.
              </div>

              <button className="btn-download" onClick={() => generatePDF(form, result)}>
                📥 Download Your Retirement Plan (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}