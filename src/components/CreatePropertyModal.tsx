import { useEffect, useRef } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    onConfirm();
  };

  return (
    <div 
      ref={ref} 
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6">
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
                  className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hostsuite-primary"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Città</label>
                  <input
                    value={form.city || ""}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Es. Roma"
                    className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hostsuite-primary"
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
                    className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hostsuite-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Indirizzo</label>
                <input
                  value={form.address || ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Es. Via Roma 123"
                  className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hostsuite-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Stato</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hostsuite-primary"
                >
                  <option value="active">Attiva</option>
                  <option value="inactive">Inattiva</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t p-4 flex justify-end gap-2 mt-auto">
            <button 
              type="button"
              onClick={onClose} 
              disabled={creating} 
              className="rounded-lg border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-hostsuite-primary"
              aria-label="Annulla creazione proprietà"
            >
              Annulla
            </button>
            <PrimaryButton
              type="submit"
              disabled={creating || !form.nome.trim()}
              aria-label={creating ? "Creazione in corso..." : "Crea nuova proprietà"}
            >
              {creating ? "Creazione..." : "Crea Proprietà"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}