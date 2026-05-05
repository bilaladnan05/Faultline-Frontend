import { useState } from "react";
import "./incidents-page.css";

const incidents = [
  {
    id: "#FL-2024-082",
    summary: "Database Latency Spike - Region US-East",
    description: "Detected 12m ago via AWS Cloudwatch",
    severity: "CRITICAL",
    status: "Active",
    assignee: "Sam Smith",
    assigneeInitials: "SS",
    avatarColor: "#4fb7c5",
    confidence: 92,
    title: "API Latency Spike & 502 Errors",
    service: "Checkout-Service v2",
    impact: "350 Users/min affected",
    elapsedTime: "00:22:45",
  }
];

export default function IncidentsPage({ onSelectIncident }) {
  const [viewMode, setViewMode] = useState("table");

  return (
    <main className="incidents-page">
      <section className="incidents-header">
        <div>
          <h1 className="page-title">Incidents List</h1>
          <p className="page-subtitle">
            Central command for monitoring, triaging, and resolving system-wide incidents detected
            by the Faultline monitoring core.
          </p>
        </div>
      </section>

      <section className="filters-bar">
        <div className="filters-left">
          <FilterPill label="All Incidents" />
          <FilterPill label="Status: Active" active />
          <FilterPill label="Severity: All" />
        </div>

        <div className="filters-right">
          <span className="results-count">Showing 24 of 1,204 results</span>
          <div className="view-toggle" aria-label="Toggle view">
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section className="table-wrapper">
        <table className="incidents-table">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th className="col-summary">INCIDENT SUMMARY</th>
              <th className="col-severity">SEVERITY</th>
              <th className="col-status">STATUS</th>
              <th className="col-assigned">ASSIGNED TO</th>
              <th className="col-confidence">AI CONFIDENCE</th>
              <th className="col-action">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} onSelectIncident={onSelectIncident} />
            ))}
          </tbody>
        </table>
      </section>

      <section className="pagination">
        <span className="pagination-info">Page 1 of 51</span>
        <div className="pagination-btns">
          <button className="page-btn" disabled type="button">Previous</button>
          <button className="page-btn" type="button">Next</button>
        </div>
      </section>
    </main>
  );
}

function IncidentRow({ incident, onSelectIncident }) {
  const severityMap = {
    CRITICAL: { className: "critical", label: "CRITICAL" },
    HIGH: { className: "high", label: "HIGH" },
    MEDIUM: { className: "medium", label: "MEDIUM" },
    LOW: { className: "low", label: "LOW" },
  };

  const statusMap = {
    Active: { className: "status-active" },
    Resolved: { className: "status-resolved" },
    Triaged: { className: "status-triaged" },
  };

  const sev = severityMap[incident.severity] ?? severityMap.LOW;
  const sta = statusMap[incident.status] ?? statusMap.Active;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      onSelectIncident?.(incident);
    }
  };

  return (
    <tr
      className="incident-row"
      tabIndex={0}
      role="button"
      onClick={() => onSelectIncident?.(incident)}
      onKeyDown={handleKeyDown}
    >
      <td className="cell-id">{incident.id}</td>
      <td className="cell-summary">
        <div className="incident-title">{incident.summary}</div>
        <div className="incident-desc">{incident.description}</div>
      </td>
      <td>
        <span className={`severity-badge ${sev.className}`}>{sev.label}</span>
      </td>
      <td>
        <span className={`status-badge ${sta.className}`}>{incident.status}</span>
      </td>
      <td>
        <div className="assignee">
          <span className="assignee-avatar" style={{ backgroundColor: incident.avatarColor }}>
            {incident.assigneeInitials}
          </span>
          <span className="assignee-name">{incident.assignee}</span>
        </div>
      </td>
      <td>
        <div className="confidence-wrap">
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${incident.confidence}%` }} />
          </div>
          <span className="confidence-pct">{incident.confidence}%</span>
        </div>
      </td>
      <td>
        <button
          className="view-link"
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelectIncident?.(incident); }}
        >VIEW</button>
      </td>
    </tr>
  );
}

function FilterPill({ label, active }) {
  return (
    <button className={`filter-pill ${active ? "active" : ""}`} type="button">
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
