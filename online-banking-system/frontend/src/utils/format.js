export function formatCurrency(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '\u20b9\u2013';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

export function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '\u2014';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
