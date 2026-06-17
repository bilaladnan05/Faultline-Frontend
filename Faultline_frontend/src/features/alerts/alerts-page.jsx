import { useState } from "react";
import "./alerts-page.css";

const alertsData = [
  {
    id: "ALT-001",
    severity: "critical",
    service: "Edge Gateway",
    issue: "Error rate 18.2% (5xx) Spike in US-East region",
    duration: "14 min",
    owner: "Faultline Bot",
    ownerType: "ai",
    status: "Investigating",
    region: "US-East",
  },
  {
    id: "ALT-002",
    severity: "high",
    service: "Auth Service",
    issue: "Login latency increased 340ms above baseline across eu-central",
    duration: "22 min",
    owner: "Alex Morgan",
    ownerType: "human",
    status: "Assigned",
    region: "EU-Central",
  },
  {
    id: "ALT-003",
    severity: "medium",
    service: "Payments",
    issue: "Retry queue buildup detected after deploy v3.1.4 rollout",
    duration: "41 min",
    owner: "Sam Smith",
    ownerType: "human",
    status: "Monitoring",
    region: "US-West",
  },
  {
    id: "ALT-004",
    severity: "high",
    service: "API Gateway",
    issue: "P99 response time exceeded 2s threshold for /api/v2/orders",
    duration: "8 min",
    owner: "Faultline Bot",
    ownerType: "ai",
    status: "Investigating",
    region: "AP-South",
  },
  {
    id: "ALT-005",
    severity: "low",
    service: "Log Ingestion",
    issue: "Log ingestion pipeline delayed by 12s due to Kafka consumer lag",
    duration: "1h 12min",
    owner: "Taylor Wong",
    ownerType: "human",
    status: "Monitoring",
    region: "Global",
  },
];

const severityConfig = {
  critical: { label: "Critical", className: "critical" },
  high: { label: "High", className: "high" },
  medium: { label: "Medium", className: "medium" },
  low: { label: "Low", className: "low" },
};

const statusConfig = {
  Investigating: "status-investigating",
  Assigned: "status-assigned",
  Monitoring: "status-monitoring",
  Resolved: "status-resolved",
};

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? alertsData
    : alertsData.filter((a) => a.severity === activeFilter);

  const counts = {
    critical: alertsData.filter((a) => a.severity === "critical").length,
    high: alertsData.filter((a) => a.severity === "high").length,
    medium: alertsData.filter((a) => a.severity === "medium").length,
    low: alertsData.filter((a) => a.severity === "low").length,
  };

  return (
    <main className="alerts-page">
      <section className="alerts-page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">
            Real-time alert feed from the Faultline monitoring core. Critical items require immediate attention.
          </p>
        </div>
        <div className="alerts-summary">
          {Object.entries(counts).map(([sev, count]) => (
            <div key={sev} className={`summary-chip ${sev}`}>
              <span className="summary-count">{count}</span>
              <span className="summary-label">{sev}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="alerts-filter-bar">
        {["all", "critical", "high", "medium", "low"].map((f) => (
          <button
            key={f}
            type="button"
            className={`alert-filter-btn ${activeFilter === f ? "active" : ""} ${f !== "all" ? f : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === "all" ? "All Alerts" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="alerts-filter-right">
          <span className="results-count">{filtered.length} alerts</span>
        </div>
      </section>

      <section className="alerts-table-section">
        <div className="alerts-table-wrap">
          <table className="alerts-main-table">
            <thead>
              <tr>
                <th>SEVERITY</th>
                <th>SERVICE</th>
                <th>ISSUE DESCRIPTION</th>
                <th>REGION</th>
                <th>DURATION</th>
                <th>OWNER</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => {
                const sev = severityConfig[alert.severity];
                return (
                  <tr key={alert.id} className="alert-row">
                    <td>
                      <span className={`sev-chip ${sev.className}`}>{sev.label}</span>
                    </td>
                    <td>
                      <div className="service-cell">
                        <span className="service-name">{alert.service}</span>
                        <span className="alert-id">{alert.id}</span>
                      </div>
                    </td>
                    <td className="issue-cell">{alert.issue}</td>
                    <td>
                      <span className="region-tag">{alert.region}</span>
                    </td>
                    <td className="duration-cell">{alert.duration}</td>
                    <td>
                      <div className="owner-cell">
                        <span className={`owner-avatar ${alert.ownerType}`}>
                          {alert.ownerType === "ai" ? "AI" : alert.owner.split(" ").map((w) => w[0]).join("")}
                        </span>
                        <span className="owner-name">{alert.owner}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`alert-status ${statusConfig[alert.status] ?? ""}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <div className="alert-actions">
                        <button className="alert-action-btn primary" type="button">Assign</button>
                        <button className="alert-action-btn" type="button">Dismiss</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
