import { useRef, useState } from "react";
import { useClient, useMutation, useQuery } from "urql";
import {
  ATTACHMENT_DATA,
  DELETE_ATTACHMENT,
  TASK_ATTACHMENTS,
  UPLOAD_ATTACHMENT,
} from "../../graphql/operations";
import { Button } from "../../components/ui";

interface Attachment {
  id: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

function fmtSize(n?: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({ taskId }: { taskId: string }) {
  const client = useClient();
  const [{ data }, refetch] = useQuery<{ taskAttachments: Attachment[] }>({
    query: TASK_ATTACHMENTS,
    variables: { taskId },
  });
  const [{ fetching: uploading }, upload] = useMutation(UPLOAD_ATTACHMENT);
  const [, del] = useMutation(DELETE_ATTACHMENT);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const items = data?.taskAttachments ?? [];

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo supera 5 MB.");
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const res = await upload({ input: { taskId, fileName: file.name, mimeType: file.type || null, base64 } });
    if (res.error) setError("No se pudo subir el archivo.");
    refetch({ requestPolicy: "network-only" });
  }

  async function download(id: string) {
    const res = await client.query(ATTACHMENT_DATA, { id }).toPromise();
    const d = res.data?.attachmentData;
    if (!d) return;
    const blob = await (await fetch(`data:${d.mimeType ?? "application/octet-stream"};base64,${d.base64}`)).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = d.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onDelete(id: string) {
    await del({ id });
    refetch({ requestPolicy: "network-only" });
  }

  return (
    <div style={{ borderBottom: "1px solid var(--gray-200)", padding: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "var(--space-2)" }}>
        <strong style={{ fontSize: "var(--text-sm)" }}>Archivos</strong>
        <div style={{ marginLeft: "auto" }}>
          <Button size="sm" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
            ＋ Adjuntar
          </Button>
          <input ref={fileRef} type="file" onChange={onPick} style={{ display: "none" }} />
        </div>
      </div>

      {error && <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginBottom: "var(--space-2)" }}>{error}</div>}

      {items.length === 0 ? (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--gray-400)" }}>Sin archivos adjuntos.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {items.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-sm)", background: "var(--gray-50)" }}>
              <span aria-hidden>📎</span>
              <button type="button" onClick={() => download(a.id)} title="Descargar" style={{ all: "unset", cursor: "pointer", flex: 1, minWidth: 0, fontSize: "var(--text-sm)", color: "var(--brand-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.fileName}
              </button>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--gray-400)" }}>{fmtSize(a.sizeBytes)}</span>
              <button type="button" aria-label="Eliminar" title="Eliminar" onClick={() => onDelete(a.id)} style={{ all: "unset", cursor: "pointer", color: "var(--gray-400)", fontSize: 13 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
