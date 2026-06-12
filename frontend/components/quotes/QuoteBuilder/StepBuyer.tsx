'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Building2, Globe, User } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';
import type { Buyer } from '@/types';
import type { UseQuoteBuilderReturn } from '@/hooks/useQuoteBuilder';

interface StepBuyerProps {
  qb: UseQuoteBuilderReturn;
}

export function StepBuyer({ qb }: StepBuyerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Buyer[]>([]);
  const [searching, setSearching] = useState(false);
  const [debouncedQuery] = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<{ data: Buyer[] }>('/buyers', { params: { search: q, limit: 8 } });
      setResults(res.data.data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery, search]);

  const selectedBuyer = qb.state.buyer;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Select Buyer</h2>
        <p className="text-sm text-slate-500">Search and select the buyer this quote is for.</p>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="buyer-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          placeholder="Search buyers by name or company..."
          autoFocus
        />
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {results.map((buyer) => (
            <button
              key={buyer.id}
              onClick={() => {
                qb.update('buyer', buyer);
                qb.update('buyerId', buyer.id);
                qb.update('currency', buyer.currency as never);
                setResults([]);
                setQuery('');
              }}
              className={`w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left ${
                selectedBuyer?.id === buyer.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-900">{buyer.companyName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {buyer.name}</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {buyer.country}</span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{buyer.currency}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {searching && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          Searching…
        </div>
      )}

      {/* Selected buyer confirmation */}
      {selectedBuyer && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-emerald-600 font-medium mb-0.5">Selected Buyer</div>
            <div className="font-semibold text-slate-900">{selectedBuyer.companyName}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              {selectedBuyer.name} · {selectedBuyer.country} · {selectedBuyer.currency}
            </div>
          </div>
          <button
            onClick={() => { qb.update('buyer', null); qb.update('buyerId', ''); }}
            className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}
