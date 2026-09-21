import { exportIncidentReport } from "./reporting.js";
import { downloadBlob } from "../utils/download.js";

/**
 * Coordinates one backend-generated incident export without owning any UI state.
 * Dependencies are injectable so transport and browser-download behavior stay focused.
 */
export async function runIncidentReportExport({
  incidentId,
  format,
  request = exportIncidentReport,
  download = downloadBlob,
  onSuccess,
  onError,
}) {
  try {
    const result = await request(incidentId, format);
    download(result.blob, result.filename);
    onSuccess?.(result);
    return result;
  } catch (error) {
    onError?.(error);
    throw error;
  }
}
