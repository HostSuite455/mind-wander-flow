import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creating: boolean;
  form: { 
    nome: string; 
    city?: string; 
    address?: string; 
    max_guests?: number | undefined; 
    status: "active" | "inactive" 
  };
  setForm: (f: any) => void;
};

export default function CreatePropertyModal({ 
  open, 
  onClose, 
  onConfirm, 
  creating, 
  form, 
  setForm 
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div 
      ref={ref} 
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Crea Nuova Proprietà</h2>
          <p className="text-sm text-gray-500">Compila almeno il nome. Tutto il resto è opzionale.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nome Proprietà *</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Es. Villa Sunset"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Città</label>
              <input
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Es. Roma"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ospiti Max</label>
              <input
                type="number"
                min={1}
                value={form.max_guests ?? ""}
                onChange={(e) => setForm({ ...form, max_guests: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Es. 4"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Indirizzo</label>
            <input
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Es. Via Roma 123"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Stato</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="active">Attiva</option>
              <option value="inactive">Inattiva</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={creating} 
            className="rounded-lg border px-3 py-2 hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={creating || !form.nome.trim()}
            className="rounded-lg bg-hostsuite-primary text-white px-3 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "Creazione..." : "Crea Proprietà"}
          </button>
        </div>
      </div>
    </div>
  );
}