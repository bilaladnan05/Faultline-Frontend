import { FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

const ACTIONS = [
  { format: "pdf", label: "PDF", icon: FileText },
  { format: "csv", label: "CSV", icon: FileSpreadsheet },
  { format: "json", label: "JSON", icon: FileJson },
];

export default function IncidentReportExportActions({ pendingFormat, onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Export incident report">
      {ACTIONS.map(({ format, label, icon: Icon }) => {
        const pending = pendingFormat === format;
        return (
          <button
            key={format}
            type="button"
            disabled={Boolean(pendingFormat)}
            aria-label={`Export incident report as ${label}`}
            onClick={() => onExport(format)}
            className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {pending ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Icon size={12} aria-hidden="true" />}
            {pending ? `Generating ${label}...` : label}
          </button>
        );
      })}
    </div>
  );
}
