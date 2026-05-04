import "./incident_row.css";

const severityConfig = {
  CRITICAL: { label: "+ CRITICAL", cls: "critical" },
  HIGH: { label: "HIGH", cls: "high" },
  MEDIUM: { label: "MEDIUM", cls: "medium" },
  LOW: { label: "LOW", cls: "low" },
};

const statusConfig = {
  Active: { cls: "status-active" },
  Resolved: { cls: "status-resolved" },
  Triaged: { cls: "status-triaged" },
};

export default function IncidentRow({ incident }) {
  const sev = severityConfig[incident.severity];
  const sta = statusConfig[incident.status];

  return (
    <tr className="incident-row">
      <td className="cell-id">{incident.id}</td>
      <td className="cell-summary">
        <p className="incident-title">{incident.summary}</p>
        <p className="incident-desc">{incident.description}</p>
      </td>
      <td className="cell-severity">
        <span className={`severity-badge ${sev.cls}`}>{sev.label}</span>
      </td>
      <td className="cell-status">
        <span className={`status-badge ${sta.cls}`}>{incident.status}</span>
      </td>
      <td className="cell-assigned">
        <div className="assignee">
          <div
            className="assignee-avatar"
            style={{ background: incident.avatarColor + "22", color: incident.avatarColor }}
          >
            {incident.assigneeInitials}
          </div>
          <span className="assignee-name">{incident.assignee}</span>
        </div>
      </td>
      <td className="cell-confidence">
        <div className="confidence-wrap">
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${incident.confidence}%` }}
            />
          </div>
          <span className="confidence-pct">{incident.confidence}%</span>
        </div>
      </td>
      <td className="cell-action">
        <button className="view-link">VIEW</button>
      </td>
    </tr>
  );
}