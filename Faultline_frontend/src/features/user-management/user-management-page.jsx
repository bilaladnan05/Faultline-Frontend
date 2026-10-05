import "./user-management-page.css";

export default function UserManagementPage() {
  const metrics = [
    { label: "Total Users", value: "42", change: "+4" },
    { label: "Active On-Call", value: "8", badge: "LIVE", badgeColor: "#ff4757" },
    { label: "Pending Invites", value: "5", change: "Expires in 48h" },
  ];

  const members = [
    {
      id: 1,
      name: "Sarah Connor",
      email: "sarah@faultline.io",
      avatar: "SC",
      role: "ADMIN",
      roleColor: "#5b6be6",
      status: "Active",
      onCall: "PRIMARY",
      onCallColor: "#5b6be6",
    },
    {
      id: 2,
      name: "Marcus Wright",
      email: "marcus@faultline.io",
      avatar: "MW",
      role: "SRE",
      roleColor: "#d1d5e0",
      status: "Active",
      onCall: "OFF-DUTY",
      onCallColor: "#d1d5e0",
    },
    {
      id: 3,
      name: "Kyle Reese",
      email: "reese@faultline.io",
      avatar: "KR",
      role: "DEVOPS ENGINEER",
      roleColor: "#d1d5e0",
      status: "Offline",
      onCall: "SECONDARY",
      onCallColor: "#5b6be6",
    },
    {
      id: 4,
      name: "Grace Harper",
      email: "grace@faultline.io",
      avatar: "GH",
      role: "SRE",
      roleColor: "#d1d5e0",
      status: "Active",
      onCall: "OFF-DUTY",
      onCallColor: "#d1d5e0",
    },
  ];

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Team Members</h1>
          <p>
            Manage your organization's members, assign granular roles, and coordinate on-call schedules across global
            timezones.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">Role Configuration</button>
          <button className="btn btn-primary">Invite User</button>
        </div>
      </div>

      <div className="metrics-section">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            {metric.change && <div className="metric-change">{metric.change}</div>}
            {metric.badge && (
              <div className="metric-badge" style={{ color: metric.badgeColor }}>
                {metric.badge}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="table-section">
        <table className="members-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>ON-CALL</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="member-cell">
                  <div className="member-info">
                    <div className="avatar">{member.avatar}</div>
                    <div className="member-details">
                      <div className="member-name">{member.name}</div>
                      <div className="member-email">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="role-badge" style={{ backgroundColor: member.roleColor }}>
                    {member.role}
                  </span>
                </td>
                <td>
                  <div className="status-cell">
                    <span className={`status-dot ${member.status.toLowerCase()}`}></span>
                    <span>{member.status}</span>
                  </div>
                </td>
                <td>
                  <span className="on-call-badge" style={{ color: member.onCallColor }}>
                    {member.onCall}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="action-btn">⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-section">
          <span className="pagination-info">Showing 1 to 10 of 42 members</span>
          <div className="pagination-buttons">
            <button className="btn-pagination">Previous</button>
            <button className="btn-pagination">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
