// CSV utility functions
export function toCSV(rows: any[], columns?: string[]): string {
  if (!rows || rows.length === 0) return '';
  
  const cols = columns || Object.keys(rows[0] || {});
  
  // Header
  const header = cols.map(col => `"${col}"`).join(',');
  
  // Rows
  const csvRows = rows.map(row => 
    cols.map(col => {
      const value = row[col];
      const stringValue = value === null || value === undefined ? '' : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return [header, ...csvRows].join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}