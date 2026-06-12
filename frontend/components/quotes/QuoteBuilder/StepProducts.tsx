'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, PackageOpen } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import type { UseQuoteBuilderReturn, QuoteBuilderItem } from '@/hooks/useQuoteBuilder';

interface StepProductsProps {
  qb: UseQuoteBuilderReturn;
}

const NUM_FIELD =
  'w-full px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400';

export function StepProducts({ qb }: StepProductsProps) {
  const { state, addItem, removeItem, updateItem } = qb;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [debouncedQuery] = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<Product[]>('/products/search', { params: { q } });
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery, search]);

  const addProduct = (product: Product) => {
    if (state.items.find((i) => i.product.id === product.id)) return;
    addItem({
      product,
      quantity: product.moq ?? 100,
      unitSupplierCost: Number(product.baseSupplierCost ?? 0),
      packagingCostPerUnit: 0,
      labelingCostPerUnit: 0,
      qcCostPerUnit: 0,
      samplingCost: 0,
      toolingCost: 0,
      marginPercent: 20,
    });
    setQuery('');
    setResults([]);
  };

  const added = new Set(state.items.map((i) => i.product.id));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Select Products</h2>
        <p className="text-sm text-slate-500">Search and add products to this quote. Configure quantities and costs per product.</p>
      </div>

      {/* Product search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="product-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          placeholder="Search by product code or description..."
        />
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {results.map((product) => {
            const isAdded = added.has(product.id);
            return (
              <div key={product.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold text-slate-700">{product.productCode}</div>
                  <div className="text-sm text-slate-800 truncate max-w-xs">{product.description}</div>
                </div>
                <button
                  onClick={() => !isAdded && addProduct(product)}
                  disabled={isAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-4 ${
                    isAdded
                      ? 'bg-emerald-50 text-emerald-600 cursor-default'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  {isAdded ? '✓ Added' : <><Plus className="w-3 h-3" /> Add</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Added items */}
      {state.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <PackageOpen className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No products added yet. Search above to add products.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.items.map((item) => (
            <ProductLineItem
              key={item.product.id}
              item={item}
              onUpdate={(updates) => updateItem(item.product.id, updates)}
              onRemove={() => removeItem(item.product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductLineItem({
  item,
  onUpdate,
  onRemove,
}: {
  item: QuoteBuilderItem;
  onUpdate: (updates: Partial<QuoteBuilderItem>) => void;
  onRemove: () => void;
}) {
  const unitTotal =
    item.unitSupplierCost +
    item.packagingCostPerUnit +
    item.labelingCostPerUnit +
    item.qcCostPerUnit;
  const lineTotal = unitTotal * item.quantity;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-xs font-semibold text-slate-500">{item.product.productCode}</div>
          <div className="font-medium text-slate-900">{item.product.description}</div>
        </div>
        <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 1 })}
            className="w-full px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-sm text-right focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Supplier Cost/unit (₹)</label>
          <input type="number" step="0.01" min="0" value={item.unitSupplierCost}
            onChange={(e) => onUpdate({ unitSupplierCost: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-sm text-right focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Packaging/unit (₹)</label>
          <input type="number" step="0.01" min="0" value={item.packagingCostPerUnit}
            onChange={(e) => onUpdate({ packagingCostPerUnit: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-sm text-right focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Margin %</label>
          <input type="number" step="0.5" min="0" max="100" value={item.marginPercent}
            onChange={(e) => onUpdate({ marginPercent: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 rounded border border-slate-200 bg-slate-50 text-sm text-right focus:outline-none focus:border-blue-400" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>Unit cost: <strong className="text-slate-800">{formatCurrency(unitTotal)}</strong></span>
        <span>Line total: <strong className="text-slate-900 text-sm">{formatCurrency(lineTotal)}</strong></span>
      </div>
    </div>
  );
}
