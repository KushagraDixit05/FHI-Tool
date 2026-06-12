'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DollarSign, Truck, Anchor, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { CurrencyRate, FreightTemplate, PortChargeTemplate } from '@/types';
import { CURRENCY_SYMBOLS } from '@/constants';

type Tab = 'currencies' | 'freight' | 'ports';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<Tab>('currencies');
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [freightTemplates, setFreightTemplates] = useState<FreightTemplate[]>([]);
  const [portCharges, setPortCharges] = useState<PortChargeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cRes, fRes, pRes] = await Promise.all([
          api.get<CurrencyRate[]>('/master/currencies'),
          api.get<FreightTemplate[]>('/master/freight-templates'),
          api.get<PortChargeTemplate[]>('/master/port-charges'),
        ]);
        setCurrencies(cRes.data);
        setFreightTemplates(fRes.data);
        setPortCharges(pRes.data);
      } catch {
        toast.error('Failed to load master data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const TABS = [
    { id: 'currencies' as Tab, label: 'Currency Rates', icon: DollarSign },
    { id: 'freight' as Tab, label: 'Freight Templates', icon: Truck },
    { id: 'ports' as Tab, label: 'Port Charges', icon: Anchor },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Master Data"
        subtitle="Manage reference data used in costing calculations"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Currency Rates */}
      {activeTab === 'currencies' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">INR Exchange Rates</h3>
            <span className="text-xs text-slate-500">Rates used for FOB → foreign currency conversion</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">From</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">To</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Rate</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Source</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Locked Date</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((rate) => (
                  <tr key={rate.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">
                      {CURRENCY_SYMBOLS[rate.fromCurrency]} {rate.fromCurrency}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">
                      {CURRENCY_SYMBOLS[rate.toCurrency]} {rate.toCurrency}
                    </td>
                    <td className="px-5 py-3 font-mono text-emerald-700 font-semibold">{rate.rate}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rate.source === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rate.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(rate.lockedDate).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Freight Templates */}
      {activeTab === 'freight' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Sea Freight Templates</h3>
            <span className="text-xs text-slate-500">{freightTemplates.length} routes configured</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {freightTemplates.map((t) => (
                <div key={t.id} className="px-5 py-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t.originPort} → {t.destinationPort}, {t.destinationCountry}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-800">20ft: {formatCurrency(Number(t.freightCost20ft))}</div>
                      <div className="text-xs text-slate-500">40ft: {formatCurrency(Number(t.freightCost40ft))}</div>
                    </div>
                  </div>
                  {t.transitDays && (
                    <div className="mt-1 text-xs text-slate-500">Transit: ~{t.transitDays} days</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Port Charges */}
      {activeTab === 'ports' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Port Charge Templates</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {portCharges.map((p) => (
                <div key={p.id} className="px-5 py-4 hover:bg-slate-50">
                  <div className="font-medium text-slate-900 mb-3">{p.portName}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'CHA Charges', value: p.chaCharges },
                      { label: 'Port Charges', value: p.portCharges },
                      { label: 'Handling', value: p.handlingCharges },
                      { label: 'Documents', value: p.documentCharges },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                        <div className="font-semibold text-slate-800 text-sm">{formatCurrency(Number(value))}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                    Total: {formatCurrency(Number(p.chaCharges) + Number(p.portCharges) + Number(p.handlingCharges) + Number(p.documentCharges))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
