import { FileDown, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { exportSystemSummary } from "../../api/reporting";
import { downloadBlob } from "../../utils/download";
import { showToast } from "../../utils/toast";

export default function SystemSummaryExport({ filters }) {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const exportPdf = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      const result = await exportSystemSummary(filters);
      downloadBlob(result.blob, result.filename);
      showToast("System summary PDF downloaded.");
    } catch {
      showToast("Could not export the system summary PDF.");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={exportPdf}
      className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
    >
      {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <FileDown size={14} aria-hidden="true" />}
      {pending ? "Generating PDF..." : "Export Summary"}
    </button>
  );
}
