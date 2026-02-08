import Link from "next/link";

export default function Home() {
  return (
    <div className="newsletter-shell">
      <section className="hero pressable">
        <div className="hero-copy">
          <p className="eyebrow">SaaS control center</p>
          <h1>Build, send, and track newsletters.</h1>
          <p className="hero-text">
            Manage lists, craft drafts in text or HTML, and launch campaigns in
            one workspace.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-card pressable">
            <p className="meta-label">Draft to READY</p>
            <p className="meta-value">Subject + content flips status.</p>
          </div>
          <div className="meta-card pressable">
            <p className="meta-label">Kafka pipeline</p>
            <p className="meta-value">Send events - delivery status</p>
          </div>
          <div className="meta-card pressable">
            <p className="meta-label">Quota aware</p>
            <p className="meta-value">500 emails per month guardrail</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Workspace shortcuts</h2>
          <p>Jump to the core parts of the platform.</p>
        </div>
        <div className="card-grid">
          <Link href="/mailing-lists" className="card pressable link-card">
            <h3>Mailing lists</h3>
            <p>Organize audiences and subscribers.</p>
          </Link>
          <Link href="/campaigns" className="card pressable link-card">
            <h3>Campaigns</h3>
            <p>Review status, update content, and send.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
