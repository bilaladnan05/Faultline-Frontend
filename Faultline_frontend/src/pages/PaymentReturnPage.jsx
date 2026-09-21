import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Mail, Zap, Clock } from "lucide-react";
import "../styles/landing.css";
import { useApiResource } from "../hooks/useApiResource";
import { getCheckoutStatus } from "../api/endpoints";

/**
 * Where the payment provider sends the browser back to.
 *
 * Both outcomes land here; `outcome` distinguishes them. The success page is
 * deliberately modest about what it claims: it reports what the *provider* says about
 * the session and then points at the purchaser's inbox. It does not report whether the
 * account exists, and it never shows credentials.
 *
 * That is not coyness. Account creation happens on a signed webhook, out of band from
 * this redirect, so at the instant this page loads the account may be a second away.
 * More importantly, whoever holds this URL is not necessarily the purchaser — the
 * session id sits in a browser history and a referrer header — so credentials belong in
 * the mailbox we sent them to, and nowhere else.
 */
export default function PaymentReturnPage({ outcome = "success" }) {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const status = useApiResource(
    ({ signal }) =>
      sessionId ? getCheckoutStatus(sessionId, { signal }) : Promise.resolve(null),
    [sessionId ?? ""],
    { enabled: outcome === "success" && !!sessionId },
  );

  const paid = status.data?.paid === true;
  const email = status.data?.email;

  return (
    <div className="fl-landing">
      <nav className="nav">
        <div className="wrap nav-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <Zap size={14} fill="currentColor" />
            </span>
            Faultline
          </Link>
          <div className="nav-actions">
            <Link className="btn" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="wrap hero-inner narrow">
            {outcome === "cancel" ? (
              <>
                <span className="badge">
                  <XCircle size={13} aria-hidden="true" />
                  Checkout cancelled
                </span>
                <h1>
                  No payment was <span className="thin">taken.</span>
                </h1>
                <p className="lede">
                  You closed the payment page before it completed, so nothing was
                  charged and no account was created. You can pick up where you left
                  off whenever you like.
                </p>
                <div className="hero-cta">
                  <Link className="btn btn-primary btn-lg" to="/subscribe">
                    Back to checkout
                  </Link>
                  <Link className="btn btn-lg" to="/">
                    Return home
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="badge">
                  <span className="dot" aria-hidden="true" />
                  {status.loading ? "Confirming payment…" : paid ? "Payment received" : "Checkout complete"}
                </span>
                <h1>
                  Check your <span className="thin">email.</span>
                </h1>

                {status.loading && (
                  <p className="lede">Confirming your payment with the provider…</p>
                )}

                {!status.loading && (
                  <p className="lede">
                    {paid
                      ? "Your subscription is active. We are creating your administrator account now and sending your username and a temporary password to"
                      : "Once the payment settles we will create your administrator account and send your username and a temporary password to"}{" "}
                    <strong>{email || "the address you entered"}</strong>.
                  </p>
                )}

                <div className="panel" style={{ marginTop: "1.5rem", textAlign: "left" }}>
                  <div className="panel-head">
                    <span className="eyebrow">What happens next</span>
                  </div>
                  <div className="panel-body">
                    <ol className="step-list">
                      <li>
                        <span className="step-n">1</span>
                        <span>
                          <Mail size={13} aria-hidden="true" /> The email arrives with
                          your <strong>username</strong> and a{" "}
                          <strong>temporary password</strong>. It can take a minute or
                          two — check your spam folder if it does not appear.
                        </span>
                      </li>
                      <li>
                        <span className="step-n">2</span>
                        <span>Sign in with those credentials.</span>
                      </li>
                      <li>
                        <span className="step-n">3</span>
                        <span>
                          Choose your own password. Until you do, the account can reach
                          nothing else — that is deliberate, because the temporary one
                          travelled through email.
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>

                {!status.loading && !paid && sessionId && (
                  <p className="notice warn" style={{ marginTop: "1rem", textAlign: "left" }}>
                    <Clock size={14} aria-hidden="true" />
                    The provider has not confirmed this payment as settled yet. Some
                    payment methods take a little longer; your credentials will arrive
                    once it clears.
                  </p>
                )}

                <div className="hero-cta">
                  <Link className="btn btn-primary btn-lg" to="/login">
                    <CheckCircle2 size={15} aria-hidden="true" /> Go to sign in
                  </Link>
                </div>
                <p className="hero-note">
                  Nothing after a few minutes? Contact support with your email address —
                  the payment is recorded either way.
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
