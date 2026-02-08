"use client";

export type ContentMode = "text" | "html";

interface DraftPreviewProps {
  subject: string;
  content: string;
  mode: ContentMode;
}

export default function DraftPreview({
  subject,
  content,
  mode,
}: DraftPreviewProps) {
  const trimmed = content.trim();

  return (
    <section className="preview-panel pressable">
      <div className="preview-header">
        <h3>Preview</h3>
        <span className="preview-mode">{mode.toUpperCase()}</span>
      </div>
      <div className="preview-body">
        <h4 className="preview-subject">
          {subject.trim() || "Subject goes here"}
        </h4>
        {trimmed ? (
          mode === "html" ? (
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <pre className="preview-content">{content}</pre>
          )
        ) : (
          <p className="preview-empty">
            Add content to see a live preview of the draft.
          </p>
        )}
      </div>
    </section>
  );
}
