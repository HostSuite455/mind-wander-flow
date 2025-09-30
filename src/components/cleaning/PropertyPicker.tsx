// Legacy component for PuliziePage
interface PropertyPickerProps {
  properties: any[];
  value: string | null;
  onChange: (value: string) => void;
}

export default function PropertyPicker({ properties, value, onChange }: PropertyPickerProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 border rounded-md"
    >
      <option value="">Seleziona proprietà</option>
      {properties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome}
        </option>
      ))}
    </select>
  );
}
