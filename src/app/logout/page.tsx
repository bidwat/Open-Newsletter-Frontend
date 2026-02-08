import LogoutButton from "@/src/components/LogoutButton";

export default function LogoutPage() {
  return (
    <div className="newsletter-shell">
      <section className="hero pressable">
        <div className="hero-copy">
          <p className="eyebrow">Session</p>
          <h1>Sign out safely.</h1>
          <p className="hero-text">
            Log out when you finish managing campaigns.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-card pressable">
            <p className="meta-label">Tip</p>
            <p className="meta-value">Drafts stay saved in the core service</p>
          </div>
        </div>
      </section>
      <section className="section">
        <LogoutButton />
      </section>
    </div>
  );
}
