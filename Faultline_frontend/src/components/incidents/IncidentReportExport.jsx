import { useRef, useState } from "react";
import { runIncidentReportExport } from "../../api/incidentReportExport";
import { showToast } from "../../utils/toast";
import IncidentReportExportActions from "./IncidentReportExportActions";

export default function IncidentReportExport({ incidentId }) {
  const [pendingFormat, setPendingFormat] = useState(null);
  const pendingRef = useRef(false);

  const handleExport = async (format) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPendingFormat(format);
    try {
      await runIncidentReportExport({
        incidentId,
        format,
        onSuccess: () => showToast(`${format.toUpperCase()} report downloaded.`),
        onError: () => showToast(`Could not export ${format.toUpperCase()} report.`),
      });
    } catch {
      // Feedback is scoped to the toast; the incident and report stay mounted.
    } finally {
      pendingRef.current = false;
      setPendingFormat(null);
    }
  };

  return <IncidentReportExportActions pendingFormat={pendingFormat} onExport={handleExport} />;
}
