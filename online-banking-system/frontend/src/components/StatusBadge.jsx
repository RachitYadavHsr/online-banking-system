const STYLES = {
  Active: 'bg-green-100 text-green-800',
  Success: 'bg-green-100 text-green-800',
  Matured: 'bg-green-100 text-green-800',
  Pending: 'bg-amber-100 text-amber-800',
  'Pending Activation': 'bg-amber-100 text-amber-800',
  Failed: 'bg-red-100 text-red-800',
  'Closed Prematurely': 'bg-gray-100 text-gray-700',
  Closed: 'bg-gray-100 text-gray-700',
  Dormant: 'bg-gray-100 text-gray-700',
  Deleted: 'bg-gray-100 text-gray-700',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
