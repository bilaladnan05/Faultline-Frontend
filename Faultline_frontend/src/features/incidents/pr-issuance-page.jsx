import { useState } from "react";
import "./pr-issuance-page.css";

const codeChanges = [
  {
    file: "src/dbClient.ts",
    line: 47,
    type: "remove",
    code: "  const timeout = 0;",
  },
  {
    file: "src/dbClient.ts",
    line: 47,
    type: "add",
    code: "  const timeout = 5000;",
  },
  {
    file: "src/dbClient.ts",
    line: 48,
    type: "add",
    code: "  // Added exponential backoff for DB retries",
  },
  {
    file: "src/dbClient.ts",
    line: 52,
    type: "add",
    code: "  retryStrategy: 'exponential_backoff',",
  },
];

const validationChecks = [
  { label: "Static Analysis", status: "passed" },
  { label: "CI Checks", status: "running" },
  { label: "Staging Deployment", status: "pending" },
];

const nextSteps = [
  "Wait for all automated CI checks to complete successfully.",
  "Verify the generated PR title and description accurately capture the fix.",
  "Click \"Submit PR\" to create the pull request on your repository.",
];

export default function PRIssuancePage({ incident, onBack }) {
  const [prTitle, setPrTitle] = useState(
    "fix(db): implement connection timeout and backoff strategy"
  );
  const [description] = useState(
    `Automated fix for ${incident?.id ?? "INC-402"}. This PR introduces a 5-second connection timeout and an exponential backoff strategy for database reconnections to prevent cascading failures during network instability.`
  );

  return (
    <div className="pr-page">
      <div className="pr-breadcrumb">
        <button className="breadcrumb-back" type="button" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Incidents
        </button>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item">{incident?.id ?? "INC-402"}</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item active">PR Issuance</span>
      </div>

      <div className="pr-header">
        <div className="pr-header-left">
          <h1 className="pr-title">PR Issuance &amp; Validation</h1>
          <p className="pr-subtitle">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            Triggered from incident <strong>{incident?.id ?? "INC-402"}</strong> · {incident?.summary ?? "Database Connection Timeout"}
          </p>
        </div>
        <div className="pr-header-actions">
          <button className="btn-discard" type="button">Discard Draft</button>
          <button className="btn-submit-pr" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            Submit PR to GitHub
          </button>
        </div>
      </div>

      <div className="pr-body">
        <div className="pr-main">
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-title-row">
                <div className="pr-card-title-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h2 className="pr-card-title">AI-Suggested Code Fix</h2>
              </div>
              <span className="confidence-badge high">HIGH CONFIDENCE</span>
            </div>

            <div className="diff-table-header">
              <span>File Path</span>
              <span>Line</span>
              <span>Changes</span>
            </div>

            <div className="diff-table">
              {codeChanges.map((change, i) => (
                <div key={i} className={`diff-row ${change.type}`}>
                  <span className="diff-file">{change.file}</span>
                  <span className="diff-line">{change.line}</span>
                  <span className="diff-code">
                    <span className="diff-sign">{change.type === "add" ? "+" : "-"}</span>
                    {change.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-title-row">
                <div className="pr-card-title-icon blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </div>
                <h2 className="pr-card-title">Pull Request Details</h2>
              </div>
            </div>

            <div className="pr-form">
              <div className="pr-field">
                <label className="pr-label">PR Title</label>
                <input
                  className="pr-input"
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                />
              </div>

              <div className="pr-field">
                <label className="pr-label">Description</label>
                <textarea className="pr-textarea" defaultValue={description} rows={4} />
              </div>

              <div className="pr-field-row">
                <div className="pr-field">
                  <label className="pr-label">Reviewers</label>
                  <div className="pr-reviewers">
                    <span className="reviewer-chip">
                      <span className="reviewer-avatar">JD</span>
                      @jdoe_eng
                    </span>
                    <button className="add-reviewer-btn" type="button">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add reviewer
                    </button>
                  </div>
                </div>

                <div className="pr-field">
                  <label className="pr-label">Labels</label>
                  <div className="pr-labels">
                    <span className="label-chip red">bug</span>
                    <span className="label-chip blue">automated-fix</span>
                    <span className="label-chip orange">hotfix</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="pr-side">
          <div className="validation-card">
            <h3 className="validation-title">Validation Checks</h3>
            <div className="validation-list">
              {validationChecks.map((check) => (
                <div key={check.label} className="validation-item">
                  <span className="validation-label">{check.label}</span>
                  <ValidationBadge status={check.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="next-steps-card">
            <h3 className="next-steps-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Next Steps
            </h3>
            <ol className="next-steps-list">
              {nextSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ValidationBadge({ status }) {
  if (status === "passed") {
    return (
      <span className="vbadge passed">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        PASSED
      </span>
    );
  }
  if (status === "running") {
    return <span className="vbadge running">RUNNING</span>;
  }
  return <span className="vbadge pending">PENDING</span>;
}
