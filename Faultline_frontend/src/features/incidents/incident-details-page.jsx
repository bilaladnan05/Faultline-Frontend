import "./incident-details-page.css";

export default function IncidentDetailsPage({ incident, onBack }) {
  const timelineSteps = [
    { label: "DETECTION", completed: true },
    { label: "TRIAGE", completed: true },
    { label: "INVESTIGATION", completed: true },
    { label: "RESOLUTION", completed: true },
    { label: "CLOSURE", completed: false },
  ];

  const tabs = [
    { name: "AI Insights", icon: "⚡" },
    { name: "Logs", icon: "📋" },
    { name: "Service Map", icon: "🗺️" },
  ];

  const manualActions = [
    { name: "Restart Service", description: "ROLLING RESTART PODS", icon: "🔄" },
    { name: "Rollback Deployment", description: "REVERT TO V2.3.11", icon: "↩️" },
  ];

  const affectedAssets = [
    { name: "checkout-deploy", severity: "critical" },
    { name: "cache-primary", severity: "warning" },
  ];

  return (
    <div className="incident-details-page">
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="header-title">
          <h1>Incident Details</h1>
          <span className="incident-id">{incident.id}</span>
        </div>
        <button className="btn-issue-pr">Issue PR 🔗</button>
      </div>

      <div className="timeline-section">
        <div className="timeline">
          {timelineSteps.map((step, index) => (
            <div key={index} className="timeline-item">
              <div className={`timeline-circle ${step.completed ? "completed" : ""}`}></div>
              <span className="timeline-label">{step.label}</span>
              {index < timelineSteps.length - 1 && <div className="timeline-connector"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="details-content">
        <div className="main-panel">
          <div className="incident-header-card">
            <div className="incident-title-section">
              <h2>{incident.title}</h2>
              <span className="severity-badge critical">CRITICAL</span>
            </div>

            <div className="impact-grid">
              <div className="impact-item">
                <div className="impact-label">IMPACTED SERVICE</div>
                <div className="impact-value">{incident.service}</div>
              </div>
              <div className="impact-item">
                <div className="impact-label">ESTIMATED IMPACT</div>
                <div className="impact-value">{incident.impact}</div>
              </div>
              <div className="impact-item">
                <div className="impact-label">ELAPSED TIME</div>
                <div className="impact-value">{incident.elapsedTime}</div>
              </div>
            </div>
          </div>

          <div className="tabs-section">
            <div className="tabs">
              {tabs.map((tab, index) => (
                <button key={index} className={`tab ${index === 0 ? "active" : ""}`}>
                  {tab.icon} {tab.name}
                </button>
              ))}
            </div>

            <div className="root-cause-section">
              <div className="root-cause-header">
                <span className="ai-icon">🤖</span>
                <h3>Root Cause Analysis</h3>
              </div>
              <p className="model-info">MODEL: FAULTLINE-LLM-V4 · 98.4% CONFIDENCE</p>

              <div className="cause-content">
                <div className="cause-item">
                  <div className="cause-header">
                    <span className="cause-icon">👁️</span>
                    <div className="cause-title">OBSERVATION</div>
                  </div>
                  <p className="cause-text">
                    Sudden spike in memory usage observed in <strong>checkout-svc</strong> pods
                    following deployment <strong>#v2.4.12</strong>.
                  </p>
                </div>

                <div className="cause-item">
                  <div className="cause-header">
                    <span className="cause-icon">🔍</span>
                    <div className="cause-title">DIAGNOSIS</div>
                  </div>
                  <p className="cause-text">
                    Connection pool leak identified in the Redis driver. Connections are not being
                    returned to the pool during high-concurrency peak.
                  </p>
                </div>
              </div>

              <div className="trace-section">
                <div className="trace-header">
                  TRACE: LOGS/CHECKOUT-F00-X89.LOG
                  <button className="copy-btn">📋</button>
                </div>
                <div className="trace-logs">
                  <div className="log-line">
                    <span className="log-time">10:42:01.663</span>
                    <span className="log-level info">[INFO]</span>
                    <span className="log-text">Initiating payment request...</span>
                  </div>
                  <div className="log-line">
                    <span className="log-time">10:42:05.120</span>
                    <span className="log-level warn">[WARN]</span>
                    <span className="log-text">Redis pool utilization: 92%</span>
                  </div>
                  <div className="log-line highlight">
                    <span className="log-time">10:42:08.881</span>
                    <span className="log-level error">[ERROR]</span>
                    <span className="log-text">ConnectionPoolExhausted: Unable to acquire connection within 3s.</span>
                  </div>
                  <div className="log-line">
                    <span className="log-time">10:42:08.882</span>
                    <span className="log-level debug">[DEBUG]</span>
                    <span className="log-text">at com.faultline.db.RedisPool.acquire(RedisPool.java:64)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="side-panel">
          <div className="remediation-card">
            <h3>⚙️ Remediation Choice</h3>

            <div className="remediation-option">
              <div className="option-header">
                <span className="option-icon">🤖</span>
                <span className="option-title">Assign to AI Agent</span>
              </div>
              <p className="option-description">
                AI will draft a PR and run validation tests.
              </p>
              <button className="btn-remediation primary">▶ Execute Auto-Fix</button>
            </div>

            <div className="remediation-option">
              <div className="option-header">
                <span className="option-icon">👤</span>
                <span className="option-title">Escalate to Developer</span>
              </div>
              <p className="option-description">
                Notify a specific team or channel to investigate manually.
              </p>
              <select className="team-select">
                <option>#prod-engineering</option>
                <option>#platform-team</option>
                <option>#infrastructure</option>
              </select>
              <button className="btn-remediation secondary">💬 Create Slack Ticket</button>
            </div>
          </div>

          <div className="manual-actions-card">
            <h3>Manual Actions</h3>
            {manualActions.map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-content">
                  <div className="action-name">{action.name}</div>
                  <div className="action-description">{action.description}</div>
                </div>
                <button className="action-expand">→</button>
              </div>
            ))}
          </div>

          <div className="affected-assets-card">
            <h3>Affected Assets</h3>
            {affectedAssets.map((asset, index) => (
              <div key={index} className={`asset-item ${asset.severity}`}>
                <span className="asset-icon">⚙️</span>
                <span className="asset-name">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
