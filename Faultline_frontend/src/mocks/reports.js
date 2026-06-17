export const mttrTrend = [
  { month: "Jan", mttr: 62 },
  { month: "Feb", mttr: 55 },
  { month: "Mar", mttr: 49 },
  { month: "Apr", mttr: 44 },
  { month: "May", mttr: 41 },
  { month: "Jun", mttr: 38 },
];

export const incidentFrequency = [
  { month: "Jan", critical: 4, high: 12, medium: 22 },
  { month: "Feb", critical: 6, high: 14, medium: 20 },
  { month: "Mar", critical: 3, high: 9, medium: 18 },
  { month: "Apr", critical: 7, high: 16, medium: 24 },
  { month: "May", critical: 5, high: 11, medium: 19 },
  { month: "Jun", critical: 2, high: 7, medium: 12 },
];

export const codeQuality = {
  score: 82,
  issues: 87,
  security: 3,
  smells: 21,
  duplications: 14,
  coverage: 73,
};

export const anomalyStats = {
  total: 143,
  resolved: 128,
  falsePositives: 6,
  avgDetectionTime: "18s",
};

export const slackTickets = [
  { incidentId: "FL-101", channel: "#prod-engineering", created: "Jun 17 · 10:18", status: "Resolved", resolvedBy: "Sarah Connor" },
  { incidentId: "FL-102", channel: "#prod-engineering", created: "Jun 17 · 09:48", status: "Open", resolvedBy: "—" },
  { incidentId: "FL-99",  channel: "#infra-alerts",     created: "Jun 17 · 08:02", status: "Resolved", resolvedBy: "Grace Harper" },
  { incidentId: "FL-97",  channel: "#sre-oncall",       created: "Jun 16 · 22:20", status: "Resolved", resolvedBy: "Marcus Wright" },
];

export const generatedReports = [
  { name: "Weekly Incident Summary",         date: "June 15, 2026", size: "1.2 MB", type: "Incident Summary", status: "ready" },
  { name: "Code Quality Audit — Q2 2026",    date: "June 10, 2026", size: "3.4 MB", type: "Code Quality",     status: "ready" },
  { name: "System Health — Monthly Report",  date: "June 01, 2026", size: "2.1 MB", type: "Performance",      status: "ready" },
  { name: "AI Remediation Effectiveness",    date: "May 25, 2026",  size: "—",      type: "Anomaly",          status: "generating" },
];
