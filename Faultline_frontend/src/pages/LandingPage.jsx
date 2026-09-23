import { Fragment } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

// Marketing page shown at "/" before anyone signs in. Everything on it is scoped
// under .fl-landing (see styles/landing.css) so the dark treatment cannot leak
// into the light app shell.

// Order matters: comments, then strings, then bare numbers.
const TOKEN_PATTERN =
  /(\/\/[^\n]*|→[^\n]*|"[^"]*"\s*[:=]|"[^"]*"|'[^']*'|\$[A-Za-z_]\w*|\bok\b|(?<![\w.-])\d+(?:\.\d+)?(?![\w.-]))/g;

function tokenClass(token) {
  if (token.startsWith("//") || token.startsWith("→")) return "c";
  if (/[:=]\s*$/.test(token)) return "k";
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith("$")) return "s";
  if (token === "ok") return "g";
  return "n";
}

// Renders a code sample with light syntax colouring. The source is passed as a
// template literal so JSX whitespace collapsing never touches the formatting.
function Code({ children }) {
  const parts = String(children).split(TOKEN_PATTERN);
  return (
    <pre className="code">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className={tokenClass(part)}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </pre>
  );
}

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 12.5L6 5.5L8.4 9.5L11.2 2.5L16 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M2 15.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

const CRACK_PATH =
  "M0 46 L318 46 L372 24 L438 62 L502 38 L560 50 L724 50 L790 18 L852 70 L916 44 L1010 44 L1078 60 L1136 30 L1200 46 L1440 46";

const CLASSIFICATIONS = [
  { name: "OOM_KILLED", hot: true },
  { name: "CRASH_LOOP", hot: true },
  { name: "HIGH_MEMORY_UTILIZATION" },
  { name: "HIGH_CPU_UTILIZATION" },
  { name: "POD_NOT_READY" },
  { name: "DEPLOYMENT_DEGRADED" },
  { name: "FAILED_SCHEDULING" },
  { name: "IMAGE_PULL_FAILURE" },
  { name: "FAILED_MOUNT" },
  { name: "NODE_NOT_READY" },
];

const EVIDENCE_LADDER = [
  { label: "High memory only", score: 0.45 },
  { label: "OOMKilled only", score: 0.8 },
  { label: "Both signals", score: 0.9 },
  { label: "Both, plus correlated restarts", score: 0.98, full: true },
];

const PIPELINE = [
  {
    kind: "Collector",
    name: "OpenTelemetry",
    desc: "DaemonSet for container logs plus one event collector. Read-only RBAC.",
    port: "OTLP/HTTP JSON",
  },
  {
    kind: "Service",
    name: "Ingestion",
    desc: "Validates the envelope, authenticates the cluster, returns 202 with an event ID.",
    port: ":3001",
  },
  {
    kind: "Broker",
    name: "NATS JetStream",
    desc: "At-least-once delivery, message-ID dedup, bounded retries, dead-letter subjects.",
    port: "telemetry.raw",
  },
  {
    kind: "Service",
    name: "Processor",
    desc: "Expiring Redis resource state, anomaly rules, incident correlation.",
    port: ":3002",
  },
  {
    kind: "Service",
    name: "API",
    desc: "Incident reads and filters, telemetry queries, resource timelines.",
    port: ":3000",
  },
];

const EVIDENCE_TRAIL = [
  { at: "14:02:11", what: "HIGH_MEMORY_UTILIZATION · 94.2%", score: "+0.45" },
  { at: "14:03:47", what: "OOM_KILLED · exit 137", score: "+0.35" },
  { at: "14:04:02", what: "restartCount 2 → 5 · BackOff", score: "+0.18" },
  { at: "14:12:30", what: "anomalies RESOLVED · 120s clock", score: "—" },
];

const INCIDENT_JSON = `// GET /incidents/inc_7f31c0/evidence
{
  "classification": "MEMORY_EXHAUSTION",
  "confidence": 0.98,
  "correlationWindowMs": 600000,
  "affectedResources": [
    "pod/payment-api-7d9c-h2k4",
    "pod/payment-api-7d9c-q8mz",
    "pod/payment-api-7d9c-x14v"
  ],
  "anomalies": 3,
  "evidence": 41,
  "timeline": 9
}

// processor stdout
event=incident_escalated
severity=warning→critical
reason=oom_killed_after_high_memory
replicas_affected=3`;

const TELEMETRY_QUERIES = `GET /telemetry/logs
  ?cluster=booknest-prod
  &namespace=checkout
  &service=payment-api
  &level=error
  &from=2026-09-09T14:00:00Z
  &to=2026-09-09T14:15:00Z

GET /resources/pod%2Fpayment-api-7d9c-h2k4/timeline
GET /incidents/inc_7f31c0/evidence
GET /incidents?status=active&severity=critical`;

const SEND_SIGNAL = `$headers = @{
  "X-Faultline-Cluster-ID"  = "booknest-prod"
  "X-Faultline-Agent-Token" = $token
}

Invoke-RestMethod $ingest/v1/telemetry/metrics \`
  -Method Post -Headers $headers \`
  -Body '{"timestamp":"2026-09-09T14:02:11Z",
    "name":"k8s.container.memory.usage",
    "value":0.942,"unit":"ratio"}'

→ 202 { status: "accepted", eventId, ingestedAt }`;

const ONBOARDING = `PS> npm run faultline:start

ok  postgres     ready    5432
ok  redis        ready    6379
ok  jetstream    ready    4222
ok  clickhouse   ready    8123
ok  migrations   12 applied
ok  api          :3000    /health/ready
ok  ingestion    :3001    /health/ready
ok  processor    :3002    /health/ready
ok  storage      :3003    /health/ready

PS> npm run cluster:onboard

// collector/booknest-prod — 1,284 logs · 96 events
// incident inc_7f31c0 opened · MEMORY_EXHAUSTION · 0.98`;

const STEPS = [
  {
    title: "Install and configure",
    body: (
      <>
        <code>npm install</code>, then <code>npm run setup</code>. Configuration is validated once at
        startup and injected as a frozen, typed object — a missing setting fails the boot instead of
        the incident.
      </>
    ),
  },
  {
    title: "Bring up the pipeline",
    body: (
      <>
        <code>npm run faultline:start</code> starts PostgreSQL, Redis, JetStream and ClickHouse, runs
        migrations, and launches all four services.
      </>
    ),
  },
  {
    title: "Point a cluster at it",
    body: (
      <>
        <code>npm run cluster:onboard</code> applies the Collector DaemonSet with minimal RBAC and
        Secret-based headers.
      </>
    ),
  },
  {
    title: "Verify with a real log",
    body: (
      <>
        The onboarding check confirms a live Kubernetes stdout log reached ClickHouse and was
        classified by the incident pipeline.
      </>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="fl-landing">
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="brand" href="#top" aria-label="Faultline home">
            <Mark />
            Faultline
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="#pipeline">Pipeline</a>
            <a href="#detection">Detection</a>
            <a href="#telemetry">Telemetry</a>
            <a href="#start">Docs</a>
          </nav>
          <div className="nav-actions">
            <Link className="btn ghost" to="/login">
              Sign in
            </Link>
            {/* The primary action for a visitor who has no account yet.
                "Open the console" used to sit here, but it points into the
                authenticated app and simply bounced them to the sign-in page. */}
            <Link className="btn btn-primary" to="/subscribe">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <svg className="crack" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
            <path d={CRACK_PATH} fill="none" stroke="var(--accent)" strokeWidth="6" opacity="0.08" />
            <path d={CRACK_PATH} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.45" />
          </svg>

          <div className="wrap hero-inner">
            <span className="badge">
              <span className="dot" aria-hidden="true" />
              Deterministic detection — no model in the critical path
            </span>
            <h1>
              Kubernetes incidents, <span className="thin">explained by evidence.</span>
            </h1>
            <p className="lede">
              Faultline reads container logs, resource metrics and Kubernetes events straight off
              your cluster, applies deterministic anomaly rules, and correlates what fires into a
              single incident with a confidence score you can audit line by line.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/subscribe">
                Subscribe now
              </Link>
              <a className="btn btn-lg" href="#pipeline">
                See the pipeline
              </a>
            </div>
            <p className="hero-note">OTLP/HTTP in, correlated incidents out</p>

            <div className="console">
              <div className="console-bar">
                <span className="path">GET /incidents/inc_7f31c0</span>
                <span className="cluster">booknest-prod</span>
              </div>
              <div className="console-body">
                <article className="incident">
                  <div className="incident-head">
                    <span className="pill">CRITICAL</span>
                    <span className="pill ok">STABILIZING</span>
                    <span className="incident-id">inc_7f31c0 · opened 14:02:11Z</span>
                  </div>
                  <h3 className="incident-title">MEMORY_EXHAUSTION</h3>
                  <p className="incident-scope">
                    deployment/payment-api · ns/checkout · 3 of 4 replicas
                  </p>

                  <div className="meter">
                    <div className="meter-row">
                      <span>Evidence score</span>
                      <span className="meter-val">0.98</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" />
                    </div>
                  </div>

                  <div className="evidence">
                    {EVIDENCE_TRAIL.map((row) => (
                      <div className="evidence-item" key={row.at}>
                        <time>{row.at}</time>
                        <span className="what">{row.what}</span>
                        <span className="score">{row.score}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <div className="stream">
                  <span className="stream-label">Correlated telemetry</span>
                  <Code>{INCIDENT_JSON}</Code>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="strip">
          <div className="wrap">
            <div className="strip-grid">
              <div className="strip-cell">
                <div className="strip-num">10</div>
                <div className="strip-cap">Deterministic anomaly rules</div>
              </div>
              <div className="strip-cell">
                <div className="strip-num">3</div>
                <div className="strip-cap">Signals: logs, metrics, events</div>
              </div>
              <div className="strip-cell">
                <div className="strip-num">
                  10<span className="unit">m</span>
                </div>
                <div className="strip-cap">Default correlation window</div>
              </div>
              <div className="strip-cell">
                <div className="strip-num">
                  30<span className="unit">d</span>
                </div>
                <div className="strip-cap">Event history in ClickHouse</div>
              </div>
            </div>
          </div>
        </section>

        <section id="pipeline" className="band">
          <div className="wrap">
            <span className="eyebrow">The path an event takes</span>
            <h2>From a container's stdout to a correlated incident.</h2>
            <p className="section-sub">
              Four services, one durable stream. Ingestion never imports processor logic, and history
              writes never sit in the detection path — a ClickHouse outage retries in storage while
              incidents keep opening.
            </p>

            <div className="pipe-scroll">
              <div className="pipe">
                {PIPELINE.map((node, index) => (
                  <Fragment key={node.name}>
                    {index > 0 && (
                      <div className="hop" aria-hidden="true">
                        <span />
                      </div>
                    )}
                    <div className="node">
                      <div className="node-kind">{node.kind}</div>
                      <div className="node-name">{node.name}</div>
                      <p className="node-desc">{node.desc}</p>
                      <div className="node-port">{node.port}</div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>

            <p className="branch">
              <span>Parallel consumer</span>
              <span className="tag">storage :3003</span>
              <span>→</span>
              <span className="tag">ClickHouse</span>
              <span>batches of 500 rows, or every 2s</span>
            </p>
          </div>
        </section>

        <section id="detection" className="band">
          <div className="wrap">
            <span className="eyebrow">Detection</span>
            <h2>Rules you can read. Scores you can defend.</h2>
            <p className="section-sub">
              Every classification comes from an independent rule with an explicit threshold and a
              stated amount of evidence behind it. Nothing is a probability estimate; nothing is a
              black box.
            </p>

            <div className="bento">
              <div className="card span-3">
                <h3>Confidence is an evidence score</h3>
                <p>
                  Each signal contributes a fixed amount. The score says how complete the evidence
                  for a memory-exhaustion incident is — not how likely it is.
                </p>
                <div className="chart">
                  {EVIDENCE_LADDER.map((row) => (
                    <div className="bar-row" key={row.label}>
                      <div>
                        <span className="bar-label">{row.label}</span>
                        <div className="bar-track">
                          <div
                            className={row.full ? "bar-fill full" : "bar-fill"}
                            style={{ width: `${row.score * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="bar-val">{row.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="axis">
                  <span>0.00</span>
                  <span>0.50</span>
                  <span>1.00</span>
                </div>
              </div>

              <div className="card span-3">
                <h3>Ten classifications, no switch statement</h3>
                <p>
                  Rules register as a list, so a new one ships without touching the ones already
                  running in production.
                </p>
                <div className="chips">
                  {CLASSIFICATIONS.map((item) => (
                    <span className={item.hot ? "chip hot" : "chip"} key={item.name}>
                      {item.name}
                    </span>
                  ))}
                </div>
                <p className="push">
                  Utilization rules need two high samples. Crash-loop needs repeated restart
                  increases <em>and</em> BackOff evidence. Native failure reasons open immediately.
                </p>
              </div>

              <div className="card span-2">
                <h3>Correlation, not a feed</h3>
                <p>
                  Cluster, namespace, Kubernetes ownership and classification relationships group
                  anomalies into one incident. Pods resolve to their Deployment through metadata, the
                  ReplicaSet owner, or a conservative name fallback.
                </p>
              </div>

              <div className="card span-2">
                <h3>A lifecycle, not an alert</h3>
                <p>
                  OPEN on first fire, ACTIVE on confirmation, RESOLVED once healthy telemetry clears
                  it. Repeat anomalies update the same incident and can escalate its severity.
                </p>
                <dl className="kv">
                  <div className="kv-row">
                    <dt>correlation window</dt>
                    <dd>10m</dd>
                  </div>
                  <div className="kv-row">
                    <dt>stabilization</dt>
                    <dd>2m</dd>
                  </div>
                  <div className="kv-row">
                    <dt>memory warn / crit</dt>
                    <dd>85% / 95%</dd>
                  </div>
                </dl>
              </div>

              <div className="card span-2">
                <h3>Survives a restart</h3>
                <p>
                  Anomaly lifecycle and rule windows checkpoint to Redis. The incident aggregate and
                  its affected resources, evidence and timeline commit to PostgreSQL in a single
                  transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="telemetry" className="band">
          <div className="wrap">
            <span className="eyebrow">Telemetry history</span>
            <h2>The raw evidence is still there when you ask.</h2>
            <p className="section-sub">
              Incidents point back at the telemetry that produced them. Every query is scoped to a
              cluster and a bounded time range, so a dashboard can't table-scan your retention.
            </p>

            <div className="split">
              <div className="panel">
                <div className="panel-head">
                  <span>Read the evidence behind an incident</span>
                  <span>HTTP</span>
                </div>
                <Code>{TELEMETRY_QUERIES}</Code>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <span>Send a signal</span>
                  <span>PowerShell</span>
                </div>
                <Code>{SEND_SIGNAL}</Code>
              </div>
            </div>

            <div className="bento tight">
              <div className="card span-2">
                <h3>Retention per signal</h3>
                <dl className="kv">
                  <div className="kv-row">
                    <dt>logs</dt>
                    <dd>7 days</dd>
                  </div>
                  <div className="kv-row">
                    <dt>metrics</dt>
                    <dd>14 days</dd>
                  </div>
                  <div className="kv-row">
                    <dt>kubernetes events</dt>
                    <dd>30 days</dd>
                  </div>
                </dl>
              </div>
              <div className="card span-2">
                <h3>Swappable by design</h3>
                <p>
                  Application code depends on <code>TelemetryStore</code>,{" "}
                  <code>IncidentRepository</code> and <code>Queue</code> — never on a ClickHouse or
                  NATS client.
                </p>
              </div>
              <div className="card span-2">
                <h3>Degrades honestly</h3>
                <p>
                  ClickHouse is critical for storage but not for the API. With history down, the API
                  reports <code className="accent">degraded</code> and keeps serving incidents.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="start" className="band">
          <div className="wrap">
            <span className="eyebrow">Onboarding</span>
            <h2>Four commands to the first real incident.</h2>
            <p className="section-sub">
              Faultline runs on your machine or in your cluster. Collectors are read-only, and
              telemetry never leaves infrastructure you control.
            </p>

            <div className="split">
              <ol className="step-list">
                {STEPS.map((step, index) => (
                  <li className="step" key={step.title}>
                    <span className="step-n">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4>{step.title}</h4>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="panel">
                <div className="panel-head">
                  <span>faultline · onboarding</span>
                  <span>PowerShell</span>
                </div>
                <Code>{ONBOARDING}</Code>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap">
            <h2>Stop reading logs. Start reading incidents.</h2>
            <p className="section-sub">
              Run the whole pipeline locally, then point a real cluster at it.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/subscribe">
                Subscribe now
              </Link>
              <a className="btn btn-lg" href="#pipeline">
                Read the architecture
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <div>
            <a className="brand" href="#top">
              <Mark />
              Faultline
            </a>
            <p className="foot-note">Kubernetes production diagnostics · NestJS · Node 22</p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <strong>Product</strong>
              <a href="#detection">Anomaly rules</a>
              <a href="#detection">Incident correlation</a>
              <a href="#telemetry">Telemetry history</a>
            </div>
            <div className="foot-col">
              <strong>Platform</strong>
              <a href="#pipeline">Pipeline</a>
              <a href="#telemetry">Storage guide</a>
              <a href="#start">Kubernetes deploy</a>
            </div>
            <div className="foot-col">
              <strong>Start</strong>
              <Link to="/subscribe">Subscribe</Link>
              <Link to="/login">Sign in</Link>
              <a href="#start">Onboarding</a>
              <a href="#start">Configuration</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
