import LoginButton from "@/src/components/LoginButton";

export default function LoginPage() {
  return (
    <div className="newsletter-shell">
      <section className="hero pressable">
        <div className="hero-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to your workspace.</h1>
          <p className="hero-text">
            Use your company account to access mailing lists, campaigns, and
            reporting.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-card pressable">
            <p className="meta-label">Secure access</p>
            <p className="meta-value">JWT-backed Auth0 session</p>
          </div>
          <div className="meta-card pressable">
            <p className="meta-label">Role ready</p>
            <p className="meta-value">User record created automatically</p>
          </div>
        </div>
      </section>
      <section className="section">
        <LoginButton />
      </section>
    </div>
  );
}
