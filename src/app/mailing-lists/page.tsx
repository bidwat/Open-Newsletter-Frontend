import MailingListsWorkspace from "@/src/components/MailingListsWorkspace";

export default function MailingListsPage() {
  return (
    <div className="newsletter-shell">
      <section className="section">
        <div className="section-head">
          <h1 className="page-title">Mailing lists</h1>
          <p>Create lists and manage subscribers.</p>
        </div>
        <MailingListsWorkspace />
      </section>
    </div>
  );
}
