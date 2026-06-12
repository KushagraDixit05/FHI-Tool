'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { INCOTERMS, CURRENCIES, CURRENCY_SYMBOLS } from '@/constants';
import type { CurrencyRate } from '@/types';
import type { UseQuoteBuilderReturn } from '@/hooks/useQuoteBuilder';

interface StepSettingsProps {
  qb: UseQuoteBuilderReturn;
}

const FIELD_CLASS =
  'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
const LABEL_CLASS = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5';

export function StepSettings({ qb }: StepSettingsProps) {
  const { state, update } = qb;
  const [rates, setRates] = useState<CurrencyRate[]>([]);

  useEffect(() => {
    api.get<CurrencyRate[]>('/master/currencies').then((r) => setRates(r.data)).catch(() => {});
  }, []);

  // Auto-fill exchange rate when currency changes
  const handleCurrencyChange = (currency: string) => {
    update('currency', currency as never);
    const rate = rates.find((r) => r.fromCurrency === 'INR' && r.toCurrency === currency);
    if (rate) update('exchangeRate', Number(rate.rate));
  };

  const INCOTERM_DESCRIPTIONS: Record<string, string> = {
    EXW: 'Buyer handles all logistics from factory gate',
    FOB: 'Seller delivers to port; buyer handles freight',
    CFR: 'Seller pays freight; buyer handles insurance',
    CIF: 'Seller pays freight + insurance',
    DDP: 'Seller handles all costs including destination customs',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Trade Settings</h2>
        <p className="text-sm text-slate-500">Configure the incoterm, currency, and FX parameters for this quote.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incoterm */}
        <div className="md:col-span-2">
          <label className={LABEL_CLASS}>Incoterm *</label>
          <div className="grid grid-cols-5 gap-2">
            {INCOTERMS.map((term) => (
              <button
                key={term}
                type="button"
                id={`incoterm-${term}`}
                onClick={() => update('incoterm', term as never)}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                  state.incoterm === term
                    ? 'border-slate-800 bg-slate-800 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
          {state.incoterm && (
            <p className="mt-2 text-xs text-slate-500 italic">
              {INCOTERM_DESCRIPTIONS[state.incoterm]}
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className={LABEL_CLASS}>Buyer Currency *</label>
          <select
            id="currency"
            value={state.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={FIELD_CLASS}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_SYMBOLS[c]} {c}
              </option>
            ))}
          </select>
        </div>

        {/* Exchange Rate */}
        <div>
          <label className={LABEL_CLASS}>Exchange Rate (INR per {state.currency}) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
              ₹
            </span>
            <input
              id="exchange-rate"
              type="number"
              step="0.01"
              min="0"
              value={state.exchangeRate || ''}
              onChange={(e) => update('exchangeRate', parseFloat(e.target.value) || 0)}
              className={`${FIELD_CLASS} pl-7`}
              placeholder="55.00"
            />
          </div>
          {rates.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {rates.find((r) => r.toCurrency === state.currency)
                ? `Reference rate: ₹${rates.find((r) => r.toCurrency === state.currency)?.rate}`
                : 'No reference rate available'}
            </p>
          )}
        </div>

        {/* FX Buffer */}
        <div>
          <label className={LABEL_CLASS}>FX Buffer % (protects against currency movement)</label>
          <div className="flex items-center gap-3">
            <input
              id="fx-buffer"
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={state.fxBuffer}
              onChange={(e) => update('fxBuffer', parseFloat(e.target.value))}
              className="flex-1 accent-slate-800"
            />
            <span className="font-mono text-sm text-slate-700 w-10 text-right">{state.fxBuffer}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Effective rate: ₹{(state.exchangeRate * (1 - state.fxBuffer / 100)).toFixed(3)} / {state.currency}
          </p>
        </div>

        {/* Valid Until */}
        <div>
          <label className={LABEL_CLASS}>Quote Valid Until</label>
          <input
            id="valid-until"
            type="date"
            value={state.validUntil}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => update('validUntil', e.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className={LABEL_CLASS}>Buyer-Facing Notes</label>
          <textarea
            id="notes"
            rows={2}
            value={state.notes}
            onChange={(e) => update('notes', e.target.value)}
            className={FIELD_CLASS}
            placeholder="Pricing valid for 30 days. Subject to availability..."
          />
        </div>

        {/* Internal Notes */}
        <div className="md:col-span-2">
          <label className={LABEL_CLASS}>Internal Notes (not visible to buyer)</label>
          <textarea
            id="internal-notes"
            rows={2}
            value={state.internalNotes}
            onChange={(e) => update('internalNotes', e.target.value)}
            className={FIELD_CLASS}
            placeholder="Follow up with supplier on lead time before sending..."
          />
        </div>
      </div>
    </div>
  );
}
