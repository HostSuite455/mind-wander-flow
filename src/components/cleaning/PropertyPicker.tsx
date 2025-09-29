export default function PropertyPicker({ 
  properties, 
  value, 
  onChange 
}: {
  properties: {id:string; nome?:string}[]; 
  value:string|null; 
  onChange:(v:string|null)=>void;
}) {
  if (!properties?.length) return null;
  
  return (
    <label className="flex gap-2 items-center">
      <span className="text-sm font-medium">Proprietà</span>
      <select 
        className="border border-border rounded px-3 py-2 bg-background" 
        value={value ?? ''} 
        onChange={e=>onChange(e.target.value||null)}
      >
        {properties.map(p=> 
          <option key={p.id} value={p.id}>
            {p.nome ?? p.id}
          </option>
        )}
      </select>
    </label>
  );
}