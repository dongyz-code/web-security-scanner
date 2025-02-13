export function downloadBlob(buffer: Blob, filename: string) {
  const url = URL.createObjectURL(buffer);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
