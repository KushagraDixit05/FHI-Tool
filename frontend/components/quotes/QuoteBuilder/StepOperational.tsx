'use client';

import { formatCurrency } from '@/lib/utils';
import type { UseQuoteBuilderReturn } from '@/hooks/useQuoteBuilder';

interface StepOperationalProps {
  qb: UseQuoteBuilderReturn;
}

const FIELD_CLASS =
  'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-right';
const LABEL_CLASS = 'block text-xs text-slate-500 mb-1';

const COST_FIELDS = [
  { key: 'bankCharges' as const, label: 'Bank Charges', help: 'LC/wire transfer fees' },
  { key: 'currencyConversionBuffer' as const, label: 'Currency Conversion Buffer', help: 'Buffer for conversion fees' },
  { key: 'platformAdminCost' as const, label: 'Platform Admin Cost', help: 'FHI platform fee allocation' },
  { key: 'travelCostAllocation' as const, label: 'Travel Cost Allocation', help: 'Factory visits, trade shows' },
  { key: 'communicationCost' as const, label: 'Communication Cost', help: 'Email, WhatsApp, calls' },
  { key: 'agentCommission' as const, label: 'Agent Commission', help: 'Broker or agent fees' },
  { key: 'miscBuffer' as const, label: 'Misc Buffer', help: 'Contingency reserve' },
] as const;

export function StepOperational({ qb }: StepOperationalProps) {
  const { state, update } = qb;

  const totalOperational =
    state.bankCharges +
    state.currencyConversionBuffer +
    state.platformAdminCost +
    state.travelCostAllocation +
    state.communicationCost +
    state.agentCommission +
    state.miscBuffer;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Operational Costs & Risk Buffer</h2>
        <p className="text-sm text-slate-500">Add overhead costs and set the risk buffer margin percentage.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COST_FIELDS.map(({ key, label, help }) => (
            <div key={key}>
              <label className={LABEL_CLASS}>
                {label}
                <span className="block text-slate-400 text-[10px]">{help}</span>
              </label>
              <input
                id={`op-${key}`}
                type="number"
                step="100"
                min="0"
                value={state[key] || ''}
                onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
                className={FIELD_CLASS}
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Risk Buffer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-800 text-sm mb-3">Risk Buffer</h3>
        <div className="flex items-center gap-4">
          <input
            id="risk-buffer"
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={state.riskBufferPercent}
            onChange={(e) => update('riskBufferPercent', parseFloat(e.target.value))}
            className="flex-1 accent-slate-800"
          />
          <span className="font-mono text-sm text-slate-700 w-12 text-right font-semibold">
            {state.riskBufferPercent}%
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Added on top of product margin — covers unexpected cost overruns and FX movements.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-3">
          <div className="text-xs text-slate-500 mb-1">Total Operational Cost</div>
          <div className="font-bold text-slate-900 font-mono">{formatCurrency(totalOperational)}</div>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-3">
          <div className="text-xs text-slate-500 mb-1">Risk Buffer</div>
          <div className="font-bold text-slate-900">{state.riskBufferPercent}%</div>
        </div>
      </div>
    </div>
  );
}
