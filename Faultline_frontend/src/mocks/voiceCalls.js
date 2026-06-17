export const voiceCalls = [
  { id: 1, ts: "2026-06-17T10:02:00Z", recipient: "Sarah Connor", phone: "+1 (555) 010-2048", incidentId: "FL-101", trigger: "Critical incident detected: DB Latency Spike", outcome: "Answered", duration: "1m 42s", summary: "Informed oncall engineer of critical checkout-svc incident. RCA shared. Auto-fix approval requested." },
  { id: 2, ts: "2026-06-17T09:46:00Z", recipient: "Marcus Wright", phone: "+1 (555) 010-3391", incidentId: "FL-102", trigger: "High severity: Auth failure rate exceeded threshold", outcome: "No Answer", duration: "—", summary: "No answer. Escalated to secondary oncall." },
  { id: 3, ts: "2026-06-17T09:47:30Z", recipient: "Grace Harper", phone: "+1 (555) 010-8812", incidentId: "FL-102", trigger: "Escalation: FL-102 — secondary oncall", outcome: "Answered", duration: "0m 58s", summary: "Secondary oncall notified. Agreed to investigate Auth0 JWKS rotation issue." },
  { id: 4, ts: "2026-06-17T08:02:00Z", recipient: "Kyle Reese", phone: "+1 (555) 010-4477", incidentId: "FL-99", trigger: "Medium: SSL certificate expiry in 48h", outcome: "Answered", duration: "0m 34s", summary: "Engineer notified about upcoming cert expiry. Manual renewal scheduled." },
  { id: 5, ts: "2026-06-16T22:15:00Z", recipient: "Sarah Connor", phone: "+1 (555) 010-2048", incidentId: "FL-97", trigger: "Critical: API Gateway 503 errors spike", outcome: "Escalated", duration: "2m 10s", summary: "Primary oncall escalated the issue to platform team lead." },
];

export const escalationSettings = {
  retryCount: 2,
  retryIntervalSeconds: 60,
  escalateToName: "Sarah Connor",
  escalateToPhone: "+1 (555) 010-2048",
  triggerOnSeverities: ["CRITICAL", "HIGH"],
};
