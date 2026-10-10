import { useState } from 'react';

export default function MpinModal({ open, onCancel, onConfirm, summary, loading, error }) {
  const [mpin, setMpin] = useState('');

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    onConfirm(mpin);
  }

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="text-lg font-bold text-navy mb-1">Confirm with MPIN</h3>
        <p className="text-sm text-gray-500 mb-4">Enter your transaction PIN to authorize this action.</p>

        {summary && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
            {Object.entries(summary)
              .filter(([, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1').replace(/Id$/, '').trim()}</span>
                  <span className="font-medium text-gray-800">{String(v)}</span>
                </div>
              ))}
          </div>
        )}

        <form onSubmit={submit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={mpin}
            onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter MPIN"
            className="w-full text-center tracking-[0.5em] text-xl border border-gray-300 rounded-lg py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || mpin.length < 4}
              className="flex-1 py-2.5 rounded-lg bg-navy text-white font-medium hover:bg-navy-light disabled:opacity-50"
            >
              {loading ? 'Confirming…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
