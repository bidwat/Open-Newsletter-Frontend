import CampaignsWorkspace from "@/src/components/CampaignsWorkspace";

export default function CampaignsPage() {
  return (
    <div className="newsletter-shell">
      <section className="section">
        <div className="section-head">
          <h1 className="page-title">Campaigns</h1>
          <p>Draft, manage, and send your campaigns.</p>
        </div>
        <CampaignsWorkspace />
      </section>
    </div>
  );
}
