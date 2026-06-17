import "./reports-page.css";

const reportMetrics = [
  { label: "TOTAL INCIDENTS", value: "1,204", delta: "+14% this month", trend: "up" },
  { label: "AVG. MTTR", value: "18m", delta: "↓2m improvement", trend: "down-good" },
  { label: "RESOLUTION RATE", value: "94.2%", delta: "+1.8% vs last month", trend: "up" },
  { label: "CODE QUALITY SCORE", value: "87/100", delta: "Stable", trend: "neutral" },
];

const recentReports = [
  {
    id: 1,
    title: "Weekly Incident Summary",
    description: "Overview of all incidents, MTTR metrics, and AI remediation actions for the week of June 9–15, 2026.",
    date: "June 15, 2026",
    type: "incident",
    pages: 4,
    status: "ready",
  },
  {
    id: 2,
    title: "Code Quality Audit — Q2 2026",
    description: "Static code analysis findings across 12 GitHub repositories including vulnerability classifications and auto-fix rates.",
    date: "June 10, 2026",
    type: "code",
    pages: 11,
    status: "ready",
  },
  {
    id: 3,
    title: "System Health — Monthly Report",
    description: "Key infrastructure performance indicators, uptime SLA adherence, and anomaly detection model accuracy for May 2026.",
    date: "June 01, 2026",
    type: "health",
    pages: 7,
    status: "ready",
  },
  {
    id: 4,
    title: "AI Remediation Effectiveness Report",
    description: "Analysis of AI-driven remediation actions — success rate, false positive rate, and human override frequency.",
    date: "May 25, 2026",
    type: "ai",
    pages: 5,
    status: "generating",
  },
];

const typeConfig = {
  incident: { label: "Incident", color: "#ef4444", bg: "#fff0f0" },
  code: { label: "Code Quality", color: "#7c3aed", bg: "#f5f3ff" },
  health: { label: "System Health", color: "#2d6cf6", bg: "#eef4ff" },
  ai: { label: "AI Analysis", color: "#d97706", bg: "#fffbeb" },
};

export default function ReportsPage() {
  return (
    <main className="reports-page">
      <section className="reports-header">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">
            Aggregated insights from incident history, code analysis, and system health metrics.
          </p>
        </div>
        <div className="reports-header-actions">
          <button className="btn-export" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export JSON
          </button>
          <button className="btn-generate" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Generate Report
          </button>
        </div>
      </section>

      <section className="reports-metric-grid">
        {reportMetrics.map((m) => (
          <div key={m.label} className="report-metric-card">
            <div className="report-metric-label">{m.label}</div>
            <div className="report-metric-value">{m.value}</div>
            <div className={`report-metric-delta ${m.trend}`}>{m.delta}</div>
          </div>
        ))}
      </section>

      <section className="reports-list-section">
        <div className="reports-list-header">
          <h2 className="reports-section-title">Generated Reports</h2>
          <p className="reports-section-sub">Click a report to preview or download in PDF / JSON format.</p>
        </div>
        <div className="reports-list">
          {recentReports.map((report) => {
            const tc = typeConfig[report.type];
            return (
              <div key={report.id} className="report-card">
                <div className="report-card-left">
                  <div className="report-type-icon" style={{ background: tc.bg, color: tc.color }}>
                    <ReportIcon type={report.type} />
                  </div>
                  <div className="report-card-info">
                    <div className="report-card-top">
                      <h3 className="report-card-title">{report.title}</h3>
                      <span className="report-type-tag" style={{ background: tc.bg, color: tc.color }}>
                        {tc.label}
                      </span>
                    </div>
                    <p className="report-card-desc">{report.description}</p>
                    <div className="report-card-meta">
                      <span className="report-date">{report.date}</span>
                      <span className="report-dot" />
                      <span className="report-pages">{report.pages} pages</span>
                    </div>
                  </div>
                </div>
                <div className="report-card-right">
                  {report.status === "generating" ? (
                    <span className="report-generating-badge">Generating...</span>
                  ) : (
                    <div className="report-download-btns">
                      <button className="report-dl-btn outline" type="button">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        PDF
                      </button>
                      <button className="report-dl-btn" type="button">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        JSON
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function ReportIcon({ type }) {
  const icons = {
    incident: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    code: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    health: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    ai: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  };
  return icons[type] ?? icons.incident;
}
