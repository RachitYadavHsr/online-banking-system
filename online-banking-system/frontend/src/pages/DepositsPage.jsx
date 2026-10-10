import { useEffect, useState } from 'react';
import { accountsApi, depositApi } from '../api';
import { apiErrorMessage } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, PageHeader, ErrorBanner, SuccessBanner, Spinner, PrimaryButton, SecondaryButton } from '../components/ui';
import StatusBadge from '../components/StatusBadge';

const EMPTY_FORM = { accountId: '', depositType: 'FD', principalAmount: '', tenureMonths: '12' };

export default function DepositsPage() {
  const [deposits, setDeposits] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    depositApi.list().then(setDeposits).catch((err) => setError(apiErrorMessage(err)));
    accountsApi.list().then(setAccounts).catch((err) => setError(apiErrorMessage(err)));
  }
  useEffect(load, []);

  async function handleOpen(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      await depositApi.open({
        accountId: Number(form.accountId),
        depositType: form.depositType,
        principalAmount: Number(form.principalAmount),
        tenureMonths: Number(form.tenureMonths),
      });
      setSuccess(`${form.depositType} opened successfully.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(id) {
    if (!window.confirm('Close this deposit prematurely? A penalty applies (interest recalculated at a reduced rate for the elapsed period).')) return;
    try {
      const res = await depositApi.closePrematurely(id);
      setSuccess(`Closed. Proceeds of ${formatCurrency(res.proceeds)} credited (penalized rate ${res.penalizedRate}%).`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (!deposits || !accounts) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Fixed & Recurring Deposits"
        subtitle="Open a new deposit or manage existing ones"
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Open Deposit'}</PrimaryButton>}
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {showForm && (
        <Card className="mb-6 max-w-lg">
          <form onSubmit={handleOpen} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Source / Linked Account</label>
              <select required value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy">
                <option value="">Select account…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} — {formatCurrency(a.balance)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <div className="flex gap-2">
                  {['FD', 'RD'].map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, depositType: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.depositType === t ? 'bg-navy text-white border-navy' : 'border-gray-300 text-gray-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tenure (months)</label>
                <input type="number" min="1" required value={form.tenureMonths}
                  onChange={(e) => setForm((f) => ({ ...f, tenureMonths: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {form.depositType === 'FD' ? 'Principal Amount (₹)' : 'Monthly Installment (₹)'}
              </label>
              <input type="number" min="1" step="0.01" required value={form.principalAmount}
                onChange={(e) => setForm((f) => ({ ...f, principalAmount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              <p className="text-xs text-gray-400 mt-1">The interest rate is set automatically based on deposit type and tenure.</p>
            </div>
            <PrimaryButton type="submit" disabled={saving} className="w-full">{saving ? 'Opening…' : 'Open Deposit'}</PrimaryButton>
          </form>
        </Card>
      )}

      {deposits.length === 0 && <Card><p className="text-gray-400 text-sm text-center py-6">No deposits yet.</p></Card>}

      {deposits.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {deposits.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{d.depositType} · {d.interestRate}% p.a.</p>
                  <p className="text-xs text-gray-400">{d.tenureMonths} months · matures {formatDate(d.maturityDate)}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-gray-400">Principal</p>
                  <p className="font-medium text-gray-700">{formatCurrency(d.principalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Maturity Amount</p>
                  <p className="font-medium text-navy">{formatCurrency(d.maturityAmount)}</p>
                </div>
              </div>
              {d.status === 'Active' && (
                <SecondaryButton onClick={() => handleClose(d.id)} className="w-full text-red-600 border-red-200 hover:bg-red-50">
                  Close Prematurely
                </SecondaryButton>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
