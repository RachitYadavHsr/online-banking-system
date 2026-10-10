import { useEffect, useState } from 'react';
import { beneficiaryApi } from '../api';
import { apiErrorMessage } from '../api/client';
import { formatDateTime } from '../utils/format';
import { Card, PageHeader, ErrorBanner, SuccessBanner, Spinner, PrimaryButton, SecondaryButton } from '../components/ui';
import StatusBadge from '../components/StatusBadge';

const EMPTY_FORM = { beneficiaryName: '', accountNumber: '', ifscCode: '', nickname: '', transferLimit: '' };

export default function BeneficiariesPage() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function load() {
    beneficiaryApi.list().then(setList).catch((err) => setError(apiErrorMessage(err)));
  }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      await beneficiaryApi.add({
        ...form,
        transferLimit: form.transferLimit ? Number(form.transferLimit) : null,
      });
      setSuccess('Beneficiary added. It will activate automatically after the cooling-off period.');
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateLimit(id, currentLimit) {
    const next = window.prompt('New per-transfer limit for this beneficiary (blank = no limit):', currentLimit ?? '');
    if (next === null) return;
    try {
      await beneficiaryApi.update(id, { transferLimit: next === '' ? null : Number(next) });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this beneficiary?')) return;
    try {
      await beneficiaryApi.remove(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Beneficiaries"
        subtitle="Payees you've added for fund transfer"
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add Beneficiary'}</PrimaryButton>}
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-3">
            <Field label="Beneficiary Name" required value={form.beneficiaryName} onChange={(v) => setForm((f) => ({ ...f, beneficiaryName: v }))} />
            <Field label="Nickname (optional)" value={form.nickname} onChange={(v) => setForm((f) => ({ ...f, nickname: v }))} />
            <Field label="Account Number" required value={form.accountNumber} onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))} />
            <Field label="IFSC Code" required value={form.ifscCode} onChange={(v) => setForm((f) => ({ ...f, ifscCode: v.toUpperCase() }))} />
            <Field label="Per-Transfer Limit (optional)" type="number" value={form.transferLimit} onChange={(v) => setForm((f) => ({ ...f, transferLimit: v }))} />
            <div className="sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Beneficiary'}</PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {!list && !error && <Spinner />}

      {list && list.length === 0 && (
        <Card><p className="text-gray-400 text-sm text-center py-6">No beneficiaries added yet.</p></Card>
      )}

      {list && list.length > 0 && (
        <div className="space-y-3">
          {list.map((b) => (
            <Card key={b.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{b.beneficiaryName}</p>
                  {b.nickname && <span className="text-xs text-gray-400">"{b.nickname}"</span>}
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-gray-400 font-mono">{b.accountNumber} · {b.ifscCode}</p>
                {b.status === 'Pending Activation' && (
                  <p className="text-xs text-amber-600 mt-1">Active from {formatDateTime(b.activeFrom)}</p>
                )}
                {b.transferLimit && (
                  <p className="text-xs text-gray-400 mt-1">Per-transfer limit: ₹{Number(b.transferLimit).toLocaleString('en-IN')}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <SecondaryButton onClick={() => handleUpdateLimit(b.id, b.transferLimit)}>Edit Limit</SecondaryButton>
                <SecondaryButton onClick={() => handleDelete(b.id)} className="text-red-600 border-red-200 hover:bg-red-50">Remove</SecondaryButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
      />
    </div>
  );
}
