"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavShell from "../components/NavShell";

const STEPS = [
  {
    number: "01",
    title: "Define a Schema",
    color: "#00bfb3",
    summary: "A schema describes a document type — what fields it contains and what each field means.",
    detail: [
      "Go to Schema Builder and create a new schema for each type of document you regularly process (e.g. \"Trade Confirmation\", \"Supplier Invoice\", \"Shoe Order\").",
      "For each field, give it a machine-readable name (e.g. shoe_brand), a display label, and optionally a description and extraction hint.",
      "Descriptions and hints are passed to the AI when extracting — the more specific they are, the better the extraction accuracy on niche or complex documents.",
      "You can edit, add, and remove fields from a schema at any time without losing existing data.",
    ],
    tip: "Tip: The AI can handle variation in document formatting. You don't need a separate schema for every counterparty — one schema per document type is enough.",
  },
  {
    number: "02",
    title: "Upload a Template (optional)",
    color: "#90caf9",
    summary: "Templates define how output documents look. Upload a Word (.docx) file and map its placeholder tokens to schema fields.",
    detail: [
      "Go to Template Studio and upload a .docx file that uses {{field_name}} tokens where you want data inserted.",
      "Once uploaded, mark the template as Active. You can mark one template as the Default for a schema — this is used by Bulk Generate.",
      "Templates are optional. You can validate and review extracted data without ever generating an output document.",
    ],
    tip: "Tip: You can have multiple templates per schema — useful for different output formats (e.g. one for internal use, one for clients).",
  },
  {
    number: "03",
    title: "Ingest a Document — or Enter Data Manually",
    color: "#b39ddb",
    summary: "Upload a document for AI extraction, or skip it entirely and type field values directly into the Queue.",
    detail: [
      "To use extraction: go to Ingest and upload a .docx or .txt file. The AI matches it to a schema and pulls out every field automatically.",
      "If you leave the schema selector blank, the AI will automatically match the document to the most appropriate schema from your library.",
      "If you already know which schema applies, pre-select it — this skips the matching step and goes straight to extraction.",
      "To enter data manually: go to the Queue and click 'New Manual Entry'. Select a schema, give the entry a label, and fill in the fields yourself — no document required.",
      "Manual entries are useful when data arrives via phone, email, or a system that doesn't produce a document.",
    ],
    tip: "Tip: Both paths end up in the same Queue. Manual entries and extracted entries are treated identically from the validation step onward.",
  },
  {
    number: "04",
    title: "Validate in the Queue",
    color: "#81c784",
    summary: "Review field values — whether extracted by AI or entered manually — correct any errors, and mark the entry as validated.",
    detail: [
      "Open any queue entry to see all field values laid out by field.",
      "Edit individual values directly in the UI — no need to re-run extraction for AI entries.",
      "Once you're satisfied with the data, click Validate. The status moves to 'Validated'.",
      "Validated entries are ready to generate output documents.",
    ],
    tip: "Tip: Even when extraction is perfect, validation is a useful checkpoint before generating documents that go to clients or counterparties.",
  },
  {
    number: "05",
    title: "Generate an Output Document",
    color: "#ffcc80",
    summary: "Fill a template with the validated data and download the finished document.",
    detail: [
      "From the queue entry detail page, choose a template and click Generate Document. The output file downloads instantly.",
      "From the main Queue page, use Generate All Validated to process every validated entry at once — as long as each schema has a default template set.",
      "All generated documents are stored and accessible from the queue entry.",
    ],
    tip: "Tip: Use Bulk Generate to process a batch at end-of-day. Set the default template on each schema once, and the rest is one click.",
  },
];

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <NavShell active="Dashboard">
      <div style={{ background: "#1a1a2e", flex: 1, padding: "24px" }}>
        <div style={{ maxWidth: 760 }}>

          <div
            style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 16, cursor: "pointer" }}
            onClick={() => router.push("/dashboard")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            ← Dashboard
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#e0e0f0", letterSpacing: -0.3, marginBottom: 6 }}>
              How rescribe.io works
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 620 }}>
              rescribe.io turns unstructured documents into structured data — and back into documents again.
              Data can arrive via AI document extraction or by manual entry directly in the Queue.
              The core loop is: <strong style={{ color: "#b39ddb" }}>define → ingest or enter → validate → generate</strong>. Here's each step in detail.
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {STEPS.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>

          {/* Flow diagram */}
          <div style={{ marginTop: 32, padding: "20px 24px", background: "#22223a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>
              The full loop
            </div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 8 }}>
              {[
                { label: "Schema",   color: "#00bfb3" },
                { label: "Template", color: "#90caf9" },
                { label: "Ingest",   color: "#b39ddb" },
                { label: "Validate", color: "#81c784" },
                { label: "Generate", color: "#ffcc80" },
              ].map(({ label, color }, i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ padding: "6px 14px", background: color + "14", border: `1px solid ${color}50`, borderRadius: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", margin: "0 6px" }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </NavShell>
  );
}

function StepCard({ step }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: "#22223a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ width: 36, height: 36, borderRadius: 2, background: step.color + "18", border: `1px solid ${step.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: step.color }}>{step.number}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0f0" }}>{step.title}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{step.summary}</div>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div style={{ padding: "0 18px 16px 68px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {step.detail.map((line, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: step.color, fontSize: 10, marginTop: 3, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{line}</span>
              </div>
            ))}
          </div>
          {step.tip && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: step.color + "10", border: `1px solid ${step.color}35`, borderRadius: 2 }}>
              <span style={{ fontSize: 11, color: step.color, lineHeight: 1.5 }}>{step.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
