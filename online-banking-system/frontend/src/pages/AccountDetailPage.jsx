import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { accountsApi } from '../api';
import { apiErrorMessage } from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Card, PageHeader, ErrorBanner, Spinner, SecondaryButton } from '../components/ui';
import StatusBadge from '../components/StatusBadge';

const TYPES = ['', 'Own-Transfer', 'NEFT', 'RTGS', 'IMPS', 'BillPay', 'Recharge'];

export default function AccountDetailPage() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [txns, setTxns] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', type: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    accountsApi.get(id).then(setAccount).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.type) params.type = filters.type;
    accountsApi.transactions(id, params).then(setTxns).catch((err) => setError(apiErrorMessage(err)));
  }, [id, filters]);

  function downloadStatement() {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.type) params.type = filters.type;
    window.open(accountsApi.statementUrl(id, params), '_blank');
  }

  return (
    <div>
      <Link to="/" className="text-sm text-navy hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
      <ErrorBanner message={error} />

      {!account && !error && <Spinner />}

      {account && (
        <>
          <PageHeader
            title={account.accountNumber}
            subtitle={`${account.accountType} Account · ${account.branchIfsc}`}
            action={<SecondaryButton onClick={downloadStatement}>Download Statement (CSV)</SecondaryButton>}
          />

          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Current Balance</p>
                <p className="text-3xl font-bold text-navy font-serif">{formatCurrency(account.balance)}</p>
              </div>
              <StatusBadge status={account.status} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Transaction History</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              />
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t || 'All types'}</option>
                ))}
              </select>
            </div>

            {!txns && <Spinner />}
            {txns && txns.length === 0 && <p className="text-gray-400 text-sm py-6 text-center">No transactions found.</p>}
            {txns && txns.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Reference</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 text-gray-600">{formatDateTime(t.initiatedAt)}</td>
                        <td className="py-2.5 text-gray-600">{t.transactionType}</td>
                        <td className="py-2.5 font-mono text-xs text-gray-400">{t.referenceNumber || '—'}</td>
                        <td className="py-2.5 text-right font-medium text-gray-800">{formatCurrency(t.amount)}</td>
                        <td className="py-2.5 text-right"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
