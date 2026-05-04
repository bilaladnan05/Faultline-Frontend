import "./dashboard-page.css";

const metricCards = [
  {
    label: "ACTIVE INCIDENTS",
    value: "12",
    delta: "\u219714% vs yesterday",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M12 2l1.5 6.5H20l-5.5 4 2 7L12 15.5 7.5 19.5l2-7L4 8.5h6.5L12 2z" />
      </svg>
    ),
    iconClass: "danger",
  },
  {
    label: "MTTR",
    value: "18m",
    delta: "\u21972m improvement",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 7v6l4 2" />
      </svg>
    ),
    iconClass: "blue",
  },
  {
    label: "HEALTH SCORE",
    value: "98.2",
    delta: "",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M12 21s-7-4.6-9.2-9.2C1.1 8.5 3.5 5 7.4 5c2 0 3.4 1 4.6 2.6C13.2 6 14.7 5 16.6 5c3.9 0 6.3 3.5 4.6 6.8C19 16.4 12 21 12 21z" />
      </svg>
    ),
    iconClass: "blue",
    progress: 96,
  },
  {
    label: "AI INSIGHT FIXES",
    value: "76%",
    delta: "\u21975% accuracy improvement",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M13 2L4 14h6l-1 8 11-14h-7l0-6z" />
      </svg>
    ),
    iconClass: "purple",
  },
];

const alerts = [
  {
    severity: "Critical",
    service: "Edge Gateway",
    issue: "Error rate 18.2% (5xx) Spike in US-East...",
    duration: "14 min",
    owner: "Faultline Bot",
    status: "Investigating",
    badgeClass: "critical",
  },
  {
    severity: "High",
    service: "Auth Service",
    issue: "Login latency increased across eu-central...",
    duration: "22 min",
    owner: "Alex Morgan",
    status: "Assigned",
    badgeClass: "high",
  },
  {
    severity: "Medium",
    service: "Payments",
    issue: "Retry queue buildup detected after deploy...",
    duration: "41 min",
    owner: "Sam Smith",
    status: "Monitoring",
    badgeClass: "medium",
  },
];

const chartPoints = {
  uptime: "M 30 212 L 110 212 L 190 212 L 270 214 L 350 212 L 430 212 L 510 212",
  latency: "M 30 190 C 70 192, 95 196, 125 194 S 195 186, 220 170 S 260 88, 310 54 S 395 170, 435 188 S 490 196, 510 198",
};

export default function DashboardPage() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">System Dashboard</h1>
          <p className="dashboard-subtitle">Real-time health telemetry and AI incident orchestration.</p>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          System Operational
        </div>
      </section>

      <section className="metric-grid">
        {metricCards.map((card) => (
          <article key={card.label} className="metric-card">
            <div className="metric-top">
              <div>
                <div className="metric-label">{card.label}</div>
                <div className="metric-value">{card.value}</div>
              </div>
              <div className={`metric-icon ${card.iconClass}`}>{card.icon}</div>
            </div>
            {card.progress ? (
              <div className="metric-progress"><span style={{ width: `${card.progress}%` }} /></div>
            ) : null}
            {card.delta ? <div className="metric-delta">{card.delta}</div> : null}
          </article>
        ))}
      </section>

      <section className="dashboard-secondary">
        <article className="chart-panel">
          <div className="panel-header">
            <div>
              <h2>System Performance</h2>
              <p>Latency & Error trends across global regions</p>
            </div>
            <div className="chart-tabs">
              <button className="chart-tab">24h</button>
              <button className="chart-tab active">7d</button>
            </div>
          </div>

          <div className="chart-area" aria-label="System performance chart">
            <svg viewBox="0 0 540 250" role="img" aria-hidden="true">
              {[50, 82, 114, 146, 178, 210].map((y) => (
                <line key={y} x1="30" y1={y} x2="510" y2={y} className="chart-grid" />
              ))}
              {[30, 110, 190, 270, 350, 430, 510].map((x, index) => (
                <text key={x} x={x} y="238" className="chart-label">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</text>
              ))}
              <text x="8" y="214" className="chart-axis">80</text>
              <text x="8" y="182" className="chart-axis">100</text>
              <text x="8" y="150" className="chart-axis">120</text>
              <text x="8" y="118" className="chart-axis">160</text>
              <text x="8" y="86" className="chart-axis">200</text>
              <text x="8" y="54" className="chart-axis">240</text>
              <path d={chartPoints.uptime} className="chart-line uptime" />
              <path d={chartPoints.latency} className="chart-line latency" />
              {[30, 110, 190, 270, 350, 430, 510].map((x) => (
                <circle key={x} cx={x} cy="212" r="4.5" className="chart-dot" />
              ))}
            </svg>
            <div className="chart-legend">
              <span><i className="legend-mark uptime" /> Uptime</span>
              <span><i className="legend-mark latency" /> Latency (ms)</span>
            </div>
          </div>
        </article>

        <aside className="ai-panel">
          <div className="panel-header ai-header">
            <div className="panel-title-inline">
              <span className="spark-icon">✦</span>
              <h2>Faultline AI</h2>
            </div>
            <span className="mini-badge">OPTIMIZING</span>
          </div>

          <div className="insight-card warning">
            <div className="insight-head">
              <strong>CAPACITY WARNING</strong>
              <span>92% Prob.</span>
            </div>
            <p>Service 'auth-broker' is nearing resource limits in eu-central-1. Upscale recommended.</p>
            <button className="link-action">Execute Auto-Scale <span>↗</span></button>
          </div>

          <div className="insight-card info">
            <div className="insight-head">
              <strong>ROUTE ANALYSIS</strong>
              <span>Stable</span>
            </div>
            <p>Network paths for APAC traffic have normalized after rerouting through Cloudfront.</p>
            <button className="link-action">View Details <span>›</span></button>
          </div>
        </aside>
      </section>

      <section className="alerts-panel">
        <div className="panel-header alerts-header">
          <div>
            <h2>Active High-Priority Alerts</h2>
            <p>Critical items requiring immediate intervention</p>
          </div>
          <button className="manager-link">View Incident Manager <span>↗</span></button>
        </div>

        <div className="alerts-table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>SEVERITY</th>
                <th>SERVICE</th>
                <th>ISSUE DESCRIPTION</th>
                <th>DURATION</th>
                <th>OWNER</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={`${alert.service}-${alert.duration}`}>
                  <td><span className={`severity-chip ${alert.badgeClass}`}>{alert.severity}</span></td>
                  <td>{alert.service}</td>
                  <td className="truncate">{alert.issue}</td>
                  <td>{alert.duration}</td>
                  <td>
                    <span className="owner-pill">AI</span>
                    {alert.owner}
                  </td>
                  <td><span className="status-text">{alert.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}