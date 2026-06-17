import "./deployments-page.css";

const services = [
  {
    id: 1,
    name: "Auth Service",
    env: "PRODUCTION",
    status: "connected",
    region: "US-East",
    wsEndpoints: "4 Active",
    icon: "shield",
    iconColor: "#2d6cf6",
    iconBg: "#eef4ff",
  },
  {
    id: 2,
    name: "Payment Gateway",
    env: "STAGING",
    status: "connected",
    region: "EU-Central",
    wsEndpoints: "2 Active",
    icon: "credit-card",
    iconColor: "#16a34a",
    iconBg: "#f0fdf4",
  },
  {
    id: 3,
    name: "User Data API",
    env: "PRODUCTION",
    status: "disconnected",
    region: "US-West",
    wsEndpoints: "0 Active",
    icon: "database",
    iconColor: "#ef4444",
    iconBg: "#fff0f0",
  },
  {
    id: 4,
    name: "Push Notifications",
    env: "STAGING",
    status: "degraded",
    region: "AP-South",
    wsEndpoints: "1/3 Active",
    icon: "bell",
    iconColor: "#d97706",
    iconBg: "#fffbeb",
  },
];

const statusConfig = {
  connected: { label: "Connected", dotColor: "#16a34a", borderColor: "#16a34a" },
  disconnected: { label: "Disconnected", dotColor: "#ef4444", borderColor: "#ef4444" },
  degraded: { label: "Degraded", dotColor: "#d97706", borderColor: "#d97706" },
};

function ServiceIcon({ icon, color, bg }) {
  const icons = {
    shield: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    "credit-card": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    database: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    bell: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  };

  return (
    <div className="service-icon-wrap" style={{ background: bg }}>
      {icons[icon]}
    </div>
  );
}

export default function DeploymentsPage() {
  return (
    <main className="deployments-page">
      <section className="deployments-header">
        <div>
          <h1 className="page-title">Deployed Applications</h1>
          <p className="page-subtitle">Manage multiple WebSocket-connected services across regions</p>
        </div>
        <button className="add-app-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Application
        </button>
      </section>

      <section className="services-stats">
        <div className="stat-pill">
          <span className="stat-dot connected" />
          <span className="stat-text"><strong>2</strong> Connected</span>
        </div>
        <div className="stat-pill">
          <span className="stat-dot degraded" />
          <span className="stat-text"><strong>1</strong> Degraded</span>
        </div>
        <div className="stat-pill">
          <span className="stat-dot disconnected" />
          <span className="stat-text"><strong>1</strong> Disconnected</span>
        </div>
      </section>

      <section className="services-grid">
        {services.map((service) => {
          const cfg = statusConfig[service.status];
          return (
            <article
              key={service.id}
              className="service-card"
              style={{ borderLeftColor: cfg.borderColor }}
            >
              <div className="service-card-top">
                <ServiceIcon icon={service.icon} color={service.iconColor} bg={service.iconBg} />
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <span className="service-env">{service.env}</span>
                </div>
                <div className="status-badge-wrap">
                  <span className="status-dot-sm" style={{ background: cfg.dotColor }} />
                  <span className="status-label" style={{ color: cfg.dotColor }}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="service-meta">
                <div className="meta-item">
                  <span className="meta-label">Region</span>
                  <span className="meta-value">{service.region}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">WS Endpoints</span>
                  <span
                    className="meta-value"
                    style={service.status === "disconnected" ? { color: "#ef4444", fontWeight: 700 } : {}}
                  >
                    {service.wsEndpoints}
                  </span>
                </div>
              </div>

              <div className="service-actions">
                <button className="svc-btn outline" type="button">View Logs</button>
                <button className="svc-btn" type="button">Manage</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
