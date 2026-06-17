export const liveLogs = [
  { id: 1, ts: "10:44:13", level: "INFO", source: "node-db-prod", msg: "Worker process initialized successfully on node-db-prod." },
  { id: 2, ts: "10:44:18", level: "INFO", source: "checkout-svc", msg: "Connection pool established. Max: 50, Min: 10." },
  { id: 3, ts: "10:44:22", level: "WARN", source: "cache-redis-02", msg: "Memory usage exceeding 80% threshold in container cache-redis-02." },
  { id: 4, ts: "10:44:27", level: "ERROR", source: "auth-svc", msg: "Failed to authenticate bearer token from origin 322-api.faultline.io — Invalid Signature." },
  { id: 5, ts: "10:44:31", level: "WARN", source: "cache-redis-02", msg: "Query usage exceeding 80% threshold on container cache-redis-02." },
  { id: 6, ts: "10:44:34", level: "INFO", source: "jvm-gc", msg: "GC cycle: heap_collection completed. Freed 2.4 GB in 1.3s." },
  { id: 7, ts: "10:44:38", level: "ERROR", source: "checkout-svc", msg: "CPU spike detected. Killing checkout-svc — JVM Created DUMP." },
  { id: 8, ts: "10:44:42", level: "INFO", source: "payments-gw", msg: "Retry successful for payment gateway connection." },
  { id: 9, ts: "10:44:45", level: "INFO", source: "api-gateway", msg: "Health check passed: api-gateway responding in 38ms." },
  { id: 10, ts: "10:44:49", level: "WARN", source: "rate-limiter", msg: "Rate limit threshold at 92% for endpoint /api/v2/orders." },
  { id: 11, ts: "10:44:53", level: "INFO", source: "scheduler", msg: "Cron job: log-archiver completed in 0.8s." },
  { id: 12, ts: "10:44:57", level: "ERROR", source: "checkout-svc", msg: "ConnectionPoolExhausted: Unable to acquire Redis connection within 3s." },
];

export const aiDecisions = [
  { id: 1, title: "Scale Up Cache", time: "2m ago", detail: "Increased Redis TTL by 30% on cache-redis-02 to reduce read pressure.", status: "resolved" },
  { id: 2, title: "Gateway Retry Policy", time: "10m ago", detail: "Payment gateway silence spike — exponential backoff policy injected.", status: "monitoring" },
  { id: 3, title: "Sig Mismatch Fix", time: "2d ago", detail: "Signature mismatch from auth-service — rotated signing key automatically.", status: "resolved" },
];
