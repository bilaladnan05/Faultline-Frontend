import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  AlertCircle,
  Building2,
  Check,
  Lock,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import "../styles/landing.css";
import { useApiResource } from "../hooks/useApiResource";
import { createCheckout, listPlans } from "../api/endpoints";

/**
 * The public purchase page.
 *
 * Reachable without an account — creating one is what a purchase does. It therefore
 * lives outside the authenticated shell entirely and wears the landing page's styling
 * rather than the console's, because it is the second step of the marketing journey,
 * not the first step of the application.
 *
 * Card details are never collected here. The form opens a hosted checkout at the
 * payment provider and hands the browser over, which keeps card data out of this
 * codebase completely. Nothing is created until the provider tells the backend, over a
 * signed webhook, that the payment actually settled — so a purchaser who closes the tab
 * mid-payment leaves nothing behind to clean up.
 *
 * The tiers are whatever `/billing/plans` returns, in the order it returns them. Which
 * tier can be bought here is the API's answer too (`checkout`), not a rule restated in
 * the UI: Enterprise is priced by conversation, so its card offers a conversation.
 */

/** Per-tier decoration. Purely presentational, so a new tier still renders sensibly. */
const TIER_ICONS = { basic: Zap, pro: Star, enterprise: Building2 };

export default function SubscribePage() {
  const plans = useApiResource(({ signal }) => listPlans({ signal }), []);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ email: "", fullName: "", username: "" });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const catalog = useMemo(() => plans.data?.plans ?? [], [plans.data]);
  const appName = plans.data?.applicationName ?? "Faultline";
  const salesContact = plans.data?.salesContact ?? null;

  // The tier the page leads with, until the visitor says otherwise. Contact-only tiers
  // are never the default: there would be no form to fill in. Derived rather than
  // stored, so the default appears the moment the catalog arrives without a second
  // render to set it.
  const defaultPlanId = useMemo(() => {
    const buyable = catalog.filter((entry) => entry.checkout === "hosted");
    return (buyable.find((entry) => entry.recommended) ?? buyable[0])?.id ?? null;
  }, [catalog]);

  const selectedId = selected ?? defaultPlanId;
  const plan = catalog.find((entry) => entry.id === selectedId) ?? null;
  const free = plan?.priceLabel === "Free";

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  // The same rule the API applies, checked here only to save a pointless round trip.
  const usernameLooksValid =
    !form.username.trim() ||
    /^[a-z0-9][a-z0-9._-]{2,31}$/.test(form.username.trim().toLowerCase());
  const canSubmit = emailLooksValid && usernameLooksValid && accepted && !!plan;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { checkoutUrl } = await createCheckout({
        email: form.email.trim(),
        plan: plan.id,
        fullName: form.fullName.trim() || undefined,
        username: form.username.trim().toLowerCase() || undefined,
      });
      window.location.assign(checkoutUrl);
    } catch (caught) {
      setError(
        caught?.isNetwork
          ? "Cannot reach the service right now. Please try again shortly."
          : caught?.message || "Could not start checkout. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fl-landing">
      <nav className="nav">
        <div className="wrap nav-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <Zap size={14} fill="currentColor" />
            </span>
            {appName}
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
          <div className="wrap hero-inner">
            <span className="badge">
              <span className="dot" aria-hidden="true" />
              Subscribe — no account needed to start
            </span>
            <h1>
              Get your team on <span className="thin">{appName}.</span>
            </h1>
            <p className="lede">
              Pick a tier and your administrator account is created straight away. Your
              username and a temporary password arrive by email; you choose a real
              password the first time you sign in.
            </p>

            {/* ------------------------------------------------------ the tiers */}
            {plans.loading && <p className="hint tiers-note">Loading pricing…</p>}
            {plans.error && catalog.length === 0 && (
              <p className="hint tiers-note">
                Pricing is temporarily unavailable. Please try again shortly.
              </p>
            )}

            {catalog.length > 0 && (
              <ul className="tiers" role="list">
                {catalog.map((entry) => {
                  const Icon = TIER_ICONS[entry.id] ?? Zap;
                  const contactOnly = entry.checkout === "contact";
                  const active = entry.id === selectedId;
                  return (
                    <li
                      key={entry.id}
                      className={`tier${active ? " is-active" : ""}${
                        entry.recommended ? " is-recommended" : ""
                      }`}
                    >
                      {entry.recommended && (
                        <span className="tier-flag">Most popular</span>
                      )}
                      <span className="tier-icon" aria-hidden="true">
                        <Icon size={16} />
                      </span>
                      <h2 className="tier-name">{entry.name}</h2>
                      <p className="price">
                        {entry.priceLabel}
                        {entry.priceLabel !== "Custom" &&
                          entry.priceLabel !== "Free" && (
                            <span className="unit"> / {entry.interval}</span>
                          )}
                      </p>
                      <p className="tier-tagline">{entry.tagline}</p>

                      <ul className="feature-list">
                        {entry.features.map((feature) => (
                          <li key={feature}>
                            <Check size={15} aria-hidden="true" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {contactOnly ? (
                        salesContact ? (
                          <a
                            className="btn full tier-cta"
                            href={`mailto:${salesContact}?subject=${encodeURIComponent(
                              `${appName} Enterprise enquiry`,
                            )}`}
                          >
                            Contact sales
                          </a>
                        ) : (
                          <span className="hint tier-cta">
                            Talk to your {appName} representative.
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          className={`btn full tier-cta${active ? " btn-primary" : ""}`}
                          aria-pressed={active}
                          disabled={entry.available === false}
                          onClick={() => {
                            setSelected(entry.id);
                            setError("");
                          }}
                        >
                          {entry.available === false
                            ? "Currently unavailable"
                            : active
                              ? "✓ Selected"
                              : `Choose ${entry.name}`}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* ----------------------------------- the chosen plan, and the form */}
            {plan && (
            <div className="split">
              <div className="panel">
                <div className="panel-head">
                  <span className="eyebrow">Plan</span>
                </div>
                {/* A confirmation of the choice, not a second copy of the card: the
                    features are three inches above, and repeating them here pushed the
                    form off the first screen. */}
                <div className="panel-body">
                  <h2 className="tight">{plan.name}</h2>
                  <p className="price">
                    {plan.priceLabel}
                    {!free && <span className="unit"> / {plan.interval}</span>}
                  </p>
                  <p className="tier-tagline">{plan.tagline}</p>
                  <ul className="feature-list">
                    <li>
                      <Check size={15} aria-hidden="true" />
                      <span>
                        {plan.features.length} features, listed above
                      </span>
                    </li>
                    <li>
                      <Check size={15} aria-hidden="true" />
                      <span>
                        {free
                          ? "Free forever, no card required"
                          : `Billed ${plan.interval}ly, cancel at any time`}
                      </span>
                    </li>
                    <li>
                      <Check size={15} aria-hidden="true" />
                      <span>Administrator account created on purchase</span>
                    </li>
                  </ul>
                  <p className="hint">
                    Picked the wrong tier? Choose another above - nothing here is
                    lost.
                  </p>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <span className="eyebrow">Your details</span>
                </div>
                <div className="panel-body">
                  {error && (
                    <p role="alert" className="notice bad">
                      <AlertCircle size={14} aria-hidden="true" />
                      {error}
                    </p>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                      <label htmlFor="sub-email">Email address</label>
                      <input
                        id="sub-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={set("email")}
                        placeholder="you@company.io"
                        autoComplete="email"
                      />
                      <p className="hint">
                        Your credentials are sent here, so make sure you can read it.
                      </p>
                    </div>

                    <div className="field">
                      <label htmlFor="sub-name">Full name</label>
                      <input
                        id="sub-name"
                        type="text"
                        value={form.fullName}
                        onChange={set("fullName")}
                        placeholder="Jane Smith"
                        autoComplete="name"
                      />
                      <p className="hint">Optional. Used to name your account.</p>
                    </div>

                    <div className="field">
                      <label htmlFor="sub-username">Preferred username</label>
                      <input
                        id="sub-username"
                        type="text"
                        value={form.username}
                        onChange={set("username")}
                        placeholder="jane.smith"
                        autoComplete="username"
                        aria-invalid={!usernameLooksValid}
                      />
                      <p className="hint">
                        {usernameLooksValid
                          ? "Optional. We generate one if you leave this blank, or if it is already taken."
                          : "3–32 characters: letters, digits, dot, dash or underscore."}
                      </p>
                    </div>

                    <label className="check">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                      />
                      <span>
                        {free
                          ? `I agree to the terms of service and understand ${plan.name} is free, with no card required.`
                          : `I agree to the terms of service and understand this is a recurring ${plan.interval}ly subscription.`}
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg full"
                      disabled={!canSubmit || submitting}
                    >
                      {submitting
                        ? "Opening secure checkout…"
                        : free
                          ? `Start on ${plan.name}`
                          : `Subscribe & Pay ${plan.priceLabel}`}
                      {!submitting && <ArrowRight size={15} aria-hidden="true" />}
                    </button>

                    <p className="hint" style={{ marginTop: "10px" }}>
                      <Lock size={11} aria-hidden="true" />{" "}
                      {free
                        ? "Confirmation is handled by our payment provider. No card is collected."
                        : "Payment is handled by our payment provider. Card details never touch our servers."}
                    </p>
                  </form>
                </div>
              </div>
            </div>
            )}

            <p className="hero-note">
              <ShieldCheck size={13} aria-hidden="true" /> Already subscribed?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
