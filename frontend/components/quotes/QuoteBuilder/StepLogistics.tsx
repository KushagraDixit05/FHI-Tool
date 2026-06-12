'use client';

import { useEffect, useState } from 'react';
import { Truck, Anchor } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { FreightTemplate, PortChargeTemplate } from '@/types';
import type { UseQuoteBuilderReturn } from '@/hooks/useQuoteBuilder';

interface StepLogisticsProps {
  qb: UseQuoteBuilderReturn;
}

const FIELD_CLASS =
  'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-right';
const LABEL_CLASS = 'block text-xs text-slate-500 mb-1';

export function StepLogistics({ qb }: StepLogisticsProps) {
  const { state, update } = qb;
  const [freightTemplates, setFreightTemplates] = useState<FreightTemplate[]>([]);
  const [portCharges, setPortCharges] = useState<PortChargeTemplate[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<FreightTemplate[]>('/master/freight-templates'),
      api.get<PortChargeTemplate[]>('/master/port-charges'),
    ]).then(([fRes, pRes]) => {
      setFreightTemplates(fRes.data);
      setPortCharges(pRes.data);
    }).catch(() => {});
  }, []);

  const handleFreightSelect = (template: FreightTemplate | null) => {
    update('freightTemplate', template);
  };

  const handlePortSelect = (template: PortChargeTemplate | null) => {
    update('portChargeTemplate', template);
  };

  const totalLogistics =
    state.inlandTransport +
    state.customsClearance +
    state.fumigation +
    state.palletization +
    state.warehousing +
    state.containerCost +
    Number(state.freightTemplate?.freightCost20ft ?? 0) +
    Number(state.portChargeTemplate?.chaCharges ?? 0) +
    Number(state.portChargeTemplate?.portCharges ?? 0) +
    Number(state.portChargeTemplate?.handlingCharges ?? 0) +
    Number(state.portChargeTemplate?.documentCharges ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Logistics Costs</h2>
        <p className="text-sm text-slate-500">Select freight/port templates or enter costs manually.</p>
      </div>

      {/* Freight Template Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-800 text-sm">Sea Freight Template</h3>
        </div>
        {freightTemplates.length > 0 ? (
          <div className="space-y-2">
            {[{ id: '', name: 'None (enter manually)', freightCost20ft: 0, freightCost40ft: 0, destinationPort: '', transitDays: null } as unknown as FreightTemplate, ...freightTemplates].map((t) => (
              <button
                key={t.id || 'none'}
                onClick={() => handleFreightSelect(t.id ? t : null)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-colors ${
                  state.freightTemplate?.id === t.id
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-800">{t.name || 'None'}</div>
                  {t.destinationPort && (
                    <div className="text-xs text-slate-500">{t.destinationPort} · {t.transitDays}d transit</div>
                  )}
                </div>
                {t.id ? (
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-slate-800">{formatCurrency(Number(t.freightCost20ft))}</div>
                    <div className="text-xs text-slate-500">per 20ft</div>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No freight templates configured. Add them in Master Data settings.</p>
        )}
      </div>

      {/* Port Charges Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Anchor className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-800 text-sm">Port Charge Template</h3>
        </div>
        {portCharges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {portCharges.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePortSelect(state.portChargeTemplate?.id === p.id ? null : p)}
                className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                  state.portChargeTemplate?.id === p.id
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="font-medium text-slate-800 mb-1">{p.portName}</div>
                <div className="text-xs text-slate-500">
                  CHA: {formatCurrency(Number(p.chaCharges))} · Port: {formatCurrency(Number(p.portCharges))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No port charge templates configured.</p>
        )}
      </div>

      {/* Manual Logistics Inputs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-800 text-sm mb-4">Additional Logistics Costs (₹)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {([
            ['inlandTransport', 'Inland Transport'],
            ['customsClearance', 'Customs Clearance'],
            ['fumigation', 'Fumigation'],
            ['palletization', 'Palletization'],
            ['warehousing', 'Warehousing'],
            ['containerCost', 'Container Cost'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL_CLASS}>{label}</label>
              <input
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

      {/* Total */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-3 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">Total Logistics Cost</span>
        <span className="font-bold text-slate-900 font-mono">{formatCurrency(totalLogistics)}</span>
      </div>
    </div>
  );
}
