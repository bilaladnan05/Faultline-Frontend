import { useState } from "react";
import IncidentRow from "./incident_row/incident_row.jsx";
import "./incidents_list.css";

const incidents = [
  {
    id: "FL-101",
    summary: "Database Latency Spike - Region US-East",
    description: "Detected 12m ago via AWS Cloudwatch",
    severity: "CRITICAL",
    status: "Active",
    assignee: "Sam Smith",
    assigneeInitials: "SS",
    avatarColor: "#f97316",
    confidence: 92,
  },
  {
    id: "FL-102",
    summary: "API Auth Failures - Auth0 Integration",
    description: "Increasing error rate (5.4%) in production",
    severity: "HIGH",
    status: "Active",
    assignee: "Alex Rivera",
    assigneeInitials: "AR",
    avatarColor: "#8b5cf6",
    confidence: 85,
  },
  {
    id: "FL-99",
    summary: "SSL Certificate Expiry Warning",
    description: "Expiring in 48 hours: payments.faultline.io",
    severity: "MEDIUM",
    status: "Resolved",
    assignee: "Jordan Lee",
    assigneeInitials: "JL",
    avatarColor: "#06b6d4",
    confidence: 45,
  },
  {
    id: "FL-98",
    summary: "Slow Page Loads - Marketing Landing Page",
    description: "Reported via user feedback session",
    severity: "LOW",
    status: "Triaged",
    assignee: "Taylor Wong",
    assigneeInitials: "TW",
    avatarColor: "#ec4899",
    confidence: 78,
  },
];

export default function IncidentsList() {
  const [viewMode, setViewMode] = useState("table");

  return (
    <div className="incidents-page">
      <div className="incidents-header">
        <div>
          <h1 className="page-title">Incidents List</h1>
          <p className="page-subtitle">
            Central command for monitoring, triaging, and resolving system-wide incidents detected
            by the Faultline monitoring core.
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filters-left">
          <FilterPill label="All Incidents" />
          <FilterPill label="Status: Active" active />
          <FilterPill label="Severity: All" />
        </div>
        <div className="filters-right">
          <span className="results-count">Showing 24 of 1,204 results</span>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
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
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="pagination-info">Page 1 of 51</span>
        <div className="pagination-btns">
          <button className="page-btn" disabled>Previous</button>
          <button className="page-btn">Next</button>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, active }) {
  return (
    <button className={`filter-pill ${active ? "active" : ""}`}>
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  );
}