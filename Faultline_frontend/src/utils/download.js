/** Triggers a browser download for a Blob already returned by the API layer. */
export function downloadBlob(blob, filename) {
  if (!(blob instanceof Blob)) throw new TypeError("downloadBlob requires a Blob");
  if (!filename) throw new TypeError("downloadBlob requires a filename");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  try {
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
