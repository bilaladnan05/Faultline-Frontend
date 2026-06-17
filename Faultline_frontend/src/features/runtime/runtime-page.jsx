import { useState } from "react";
import "./runtime-page.css";

const logEntries = [
  { time: "10:44:13", level: "INFO", message: "Worker process initialized successfully on node-db-prod." },
  { time: "10:44:18", level: "INFO", message: "Connection pool established. Max: 50, Min: 10." },
  { time: "10:44:22", level: "WARN", message: "Memory usage exceeding 80% threshold in container cache-redis-02." },
  { time: "10:44:27", level: "ERROR", message: "Failed to authenticate bearer token from origin 322-api.faultline.io — Invalid Signature." },
  { time: "10:44:31", level: "WARN", message: "Query usage exceeding 80% threshold on container cache-redis-02." },
  { time: "10:44:34", level: "INFO", message: "GC cycle: heap_collection cycle completed. Freed 2.4GB in 1.3s." },
  { time: "10:44:38", level: "ERROR", message: "CPU spike detected. Killing checkout-svc — JVM Created DUMP." },
  { time: "10:44:42", level: "INFO", message: "Retry successful for payment gateway connection." },
  { time: "10:44:45", level: "INFO", message: "Health check passed: api-gateway responding in 38ms." },
  { time: "10:44:49", level: "WARN", message: "Rate limit threshold at 92% for endpoint /api/v2/orders." },
];

const aiDecisions = [
  {
    id: 1,
    title: "Scale Up Cache",
    time: "2m ago",
    detail: "Increased Redis TTL by 30% on cache-redis-02 to reduce read pressure.",
    status: "resolved",
    statusLabel: "RESOLVED",
    replies: 11,
  },
  {
    id: 2,
    title: "Gateway Retry",
    time: "10m ago",
    detail: "Payment gateway silence spike injected exponential backoff policy.",
    status: "monitoring",
    statusLabel: "MONITORING",
    replies: null,
  },
  {
    id: 3,
    title: "Sig Mismatch Fix",
    time: "2d ago",
    detail: "Signature mismatch from auth-service rotated signing key automatically.",
    status: "resolved",
    statusLabel: "RESOLVED",
    replies: null,
  },
];

export default function RuntimePage() {
  const [isPaused, setIsPaused] = useState(false);
  const [autoRemediation, setAutoRemediation] = useState(true);
  const [logSearch, setLogSearch] = useState("");

  const filteredLogs = logSearch
    ? logEntries.filter((l) => l.message.toLowerCase().includes(logSearch.toLowerCase()) || l.level.toLowerCase().includes(logSearch.toLowerCase()))
    : logEntries;

  return (
    <main className="runtime-page">
      <section className="runtime-hero">
        <div>
          <h1 className="runtime-title">Runtime Monitoring</h1>
          <p className="runtime-subtitle">Real-time application execution metrics and logs.</p>
        </div>
        <div className="system-healthy-pill">
          <span className="healthy-dot" />
          System Healthy
        </div>
      </section>

      <section className="ws-config-card">
        <div className="ws-config-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          WebSocket Config
        </div>
        <div className="ws-fields">
          <div className="ws-field">
            <label className="ws-label">Server URL</label>
            <input className="ws-input" type="text" defaultValue="wss://api.production.com/stream" readOnly />
          </div>
          <div className="ws-field">
            <label className="ws-label">Auth Token</label>
            <div className="ws-token-wrap">
              <input className="ws-input" type="password" defaultValue="sk-faultline-prod-token-xx9" />
              <button className="ws-eye-btn" type="button" aria-label="Show token">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
          <button className="ws-disconnect-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Disconnect
          </button>
        </div>
      </section>

      <div className="runtime-body">
        <div className="runtime-left">
          <div className="conn-status-card">
            <h2 className="card-title">Connection Status</h2>
            <div className="conn-metrics">
              <div className="conn-metric">
                <span className="conn-label">Status</span>
                <span className="conn-value connected-val">
                  <span className="conn-dot" />
                  Connected
                </span>
              </div>
              <div className="conn-metric">
                <span className="conn-label">Latency</span>
                <span className="conn-value">24ms</span>
              </div>
              <div className="conn-metric">
                <span className="conn-label">Uptime</span>
                <span className="conn-value">14d 03h 22m</span>
              </div>
              <div className="conn-metric">
                <span className="conn-label">Messages/min</span>
                <span className="conn-value">
                  1,204
                  <span className="mini-sparkline" aria-hidden="true">
                    <svg width="44" height="18" viewBox="0 0 44 18">
                      <polyline points="2,14 8,10 14,12 20,6 26,4 32,8 38,5 44,7" fill="none" stroke="#2d6cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="log-stream-card">
            <div className="log-stream-header">
              <h2 className="card-title">Live Log Stream</h2>
              <div className="log-controls">
                <div className="log-search-wrap">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    className="log-search"
                    type="text"
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                </div>
                <button
                  className={`log-ctrl-btn ${isPaused ? "paused" : ""}`}
                  type="button"
                  onClick={() => setIsPaused((v) => !v)}
                >
                  {isPaused ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                      </svg>
                      Pause
                    </>
                  )}
                </button>
                <button className="log-ctrl-btn" type="button">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filter
                </button>
              </div>
            </div>

            <div className="log-stream">
              {filteredLogs.map((log, i) => (
                <div key={i} className={`log-entry level-${log.level.toLowerCase()}`}>
                  <span className="log-ts">{log.time}</span>
                  <span className={`log-lvl ${log.level.toLowerCase()}`}>[{log.level}]</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="log-empty">No matching log entries.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="runtime-right">
          <div className="intelligent-response-card">
            <div className="ir-header">
              <div className="ir-title-row">
                <h2 className="card-title">Intelligent Response</h2>
                <span className="ir-active-badge">ACTIVE</span>
              </div>
            </div>

            <div className="ir-toggle-row">
              <div className="ir-toggle-info">
                <span className="ir-toggle-label">Auto-Remediation</span>
                <span className="ir-toggle-sub">AI will execute predefined playbooks</span>
              </div>
              <button
                className={`toggle-switch ${autoRemediation ? "on" : ""}`}
                type="button"
                role="switch"
                aria-checked={autoRemediation}
                onClick={() => setAutoRemediation((v) => !v)}
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <button className="btn-issue-incident" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Issue Incident
            </button>

            <div className="ir-divider" />

            <h3 className="ir-section-title">Recent AI Decisions</h3>

            <div className="ai-decisions-list">
              {aiDecisions.map((decision) => (
                <div key={decision.id} className="ai-decision-item">
                  <div className="ai-decision-top">
                    <span className="ai-decision-title">{decision.title}</span>
                    <span className="ai-decision-time">{decision.time}</span>
                  </div>
                  <p className="ai-decision-detail">{decision.detail}</p>
                  <div className="ai-decision-footer">
                    <span className={`ai-status-chip ${decision.status}`}>{decision.statusLabel}</span>
                    {decision.replies && (
                      <span className="ai-replies">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {decision.replies} replies
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
