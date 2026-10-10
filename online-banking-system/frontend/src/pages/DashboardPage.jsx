import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '../api';
import { apiErrorMessage } from '../api/client';
import { formatCurrency } from '../utils/format';
import { Card, PageHeader, ErrorBanner, Spinner } from '../components/ui';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    accountsApi.list().then(setAccounts).catch((err) => setError(apiErrorMessage(err)));
  }, []);

  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) ?? 0;

  return (
    <div>
      <PageHeader title="Account Dashboard" subtitle="All accounts linked to your profile" />
      <ErrorBanner message={error} />

      {!accounts && !error && <Spinner />}

      {accounts && (
        <>
          <Card className="mb-6 bg-navy text-white border-none">
            <p className="text-ice text-sm mb-1">Total balance across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            <p className="text-3xl font-bold font-serif">{formatCurrency(totalBalance)}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((acc) => (
              <Link key={acc.id} to={`/accounts/${acc.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{acc.accountType} Account</p>
                      <p className="font-mono text-sm text-gray-600 mt-0.5">{acc.accountNumber}</p>
                    </div>
                    <StatusBadge status={acc.status} />
                  </div>
                  <p className="text-2xl font-bold text-navy">{formatCurrency(acc.balance)}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Holder role: <span className="font-medium text-gray-600">{acc.holderRole}</span>
                    {acc.holderRole === 'Joint' && ' — shared account'}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {accounts.length === 0 && (
            <Card>
              <p className="text-gray-500 text-sm">No accounts are linked to your profile yet.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
