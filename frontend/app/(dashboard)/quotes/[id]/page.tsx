'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Copy, Pencil, ChevronRight, Loader2,
  Building2, Globe, FileText, Package, Truck, DollarSign
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge, Button, Card, Skeleton } from '@/components/ui';
import { CostingPanel } from '@/components/costing/CostingPanel';
import { StatusTimeline } from '@/components/quotes/StatusTimeline';
import { useCosting } from '@/hooks/useCosting';
import { STATUS_TRANSITIONS, STATUS_LABELS } from '@/constants';
import type { Quote, CostingInput } from '@/types';

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const { result, calculate } = useCosting();

  const fetchQuote = async () => {
    try {
      const res = await api.get<Quote>(`/quotes/${id}`);
      setQuote(res.data);
      return res.data;
    } catch {
      toast.error('Failed to load quote');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuote(); }, [id]);

  // Trigger costing calc when quote loads
  useEffect(() => {
    if (!quote || !quote.items?.length) return;
    const totalQty = quote.items.reduce((s, i) => s + i.quantity, 0);
    const totalCost = quote.costs?.reduce((s, c) => s + Number(c.amount), 0) ?? 0;
    const avgUnitCost = quote.items.reduce((s, i) => s + Number(i.unitSupplierCost), 0) / quote.items.length;
    const avgMargin = quote.items.reduce((s, i) => s + Number(i.marginPercent), 0) / quote.items.length;

    const costMap: Partial<Record<string, number>> = {};
    quote.costs?.forEach((c) => { costMap[c.label] = Number(c.amount); });

    const input: CostingInput = {
      quantity: totalQty,
      unitSupplierCost: avgUnitCost,
      packagingCostPerUnit: 0,
      labelingCostPerUnit: 0,
      qcCostPerUnit: 0,
      samplingCost: 0,
      toolingCost: 0,
      inlandTransport: costMap['Inland Transport'] ?? 0,
      freightCost: costMap['Sea Freight'] ?? 0,
      chaCharges: costMap['CHA Charges'] ?? 0,
      portCharges: costMap['Port Charges'] ?? 0,
      customsClearance: costMap['Customs Clearance'] ?? 0,
      documentCharges: costMap['Document Charges'] ?? 0,
      palletization: costMap['Palletization'] ?? 0,
      fumigation: costMap['Fumigation'] ?? 0,
      warehousing: costMap['Warehousing'] ?? 0,
      insurance: 0,
      containerCost: costMap['Container Cost'] ?? 0,
      handlingCharges: costMap['Handling Charges'] ?? 0,
      exportDuty: 0,
      inspectionCharges: 0,
      bankCharges: costMap['Bank Charges'] ?? 0,
      currencyConversionBuffer: costMap['Currency Conversion Buffer'] ?? 0,
      platformAdminCost: costMap['Platform Admin Cost'] ?? 0,
      travelCostAllocation: costMap['Travel Cost Allocation'] ?? 0,
      communicationCost: costMap['Communication Cost'] ?? 0,
      agentCommission: costMap['Agent Commission'] ?? 0,
      miscBuffer: costMap['Misc Buffer'] ?? 0,
      marginPercent: avgMargin,
      riskBufferPercent: 3,
      exchangeRate: Number(quote.exchangeRate),
      fxBufferPercent: Number(quote.fxBuffer),
      incoterm: quote.incoterm as never,
    };
    calculate(input);
  }, [quote]);

  const handleStatusTransition = async (toStatus: string) => {
    if (!quote) return;
    setStatusUpdating(true);
    try {
      await api.patch(`/quotes/${id}/status`, { toStatus });
      toast.success(`Quote moved to: ${STATUS_LABELS[toStatus]}`);
      const updated = await fetchQuote();
      if (updated) setQuote(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update status';
      toast.error(msg);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDuplicate = async () => {
    if (!quote) return;
    setDuplicating(true);
    try {
      const res = await api.post<Quote>(`/quotes/${id}/duplicate`);
      toast.success(`Duplicate created: ${res.data.quoteNumber}`);
      router.push(`/quotes/${res.data.id}`);
    } catch {
      toast.error('Failed to duplicate quote');
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const allowedTransitions = STATUS_TRANSITIONS[quote.status] ?? [];
  const totalValue = quote.items?.reduce((s, i) => s + Number(i.totalLineValue), 0) ?? 0;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/quotes')} className="-ml-3 mb-2 text-slate-500">
            <ArrowLeft /> Quotes
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{quote.quoteNumber}</h1>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Created {formatDate(quote.createdAt)} by {quote.createdBy?.name}
            {quote.validUntil && ` · Valid until ${formatDate(quote.validUntil)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDuplicate} loading={duplicating}>
            {!duplicating && <Copy />}
            Duplicate
          </Button>
          {quote.status === 'DRAFT' && (
            <Button id="edit-quote-btn" onClick={() => router.push(`/quotes/${id}/edit`)}>
              <Pencil /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Buyer + Trade Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Trade Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { icon: Building2, label: 'Buyer', value: quote.buyer?.companyName, sub: quote.buyer?.country },
                { icon: Globe, label: 'Incoterm', value: quote.incoterm, sub: null },
                { icon: DollarSign, label: 'Currency', value: quote.currency, sub: `@ ₹${quote.exchangeRate}` },
                { icon: Package, label: 'Products', value: `${quote.items?.length ?? 0} SKU(s)`, sub: null },
                { icon: FileText, label: 'Total Value', value: formatCurrency(totalValue), sub: null },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                    <Icon className="w-3 h-3" /> {label}
                  </div>
                  <div className="font-semibold text-slate-900">{value}</div>
                  {sub && <div className="text-xs text-slate-500">{sub}</div>}
                </div>
              ))}
            </div>
            {quote.notes && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Buyer-Facing Notes</div>
                <p className="text-sm text-slate-700">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Product Line Items */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Line Items</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {quote.items?.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-slate-500">{item.product?.productCode}</div>
                      <div className="font-medium text-slate-900">{item.product?.description}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Qty: {item.quantity.toLocaleString()} ·
                        Supplier: {formatCurrency(Number(item.unitSupplierCost))}/unit ·
                        Margin: {item.marginPercent}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatCurrency(Number(item.totalLineValue))}</div>
                      <div className="text-xs text-slate-500">{formatCurrency(Number(item.unitSellingPrice))}/unit</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Total Quote Value</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          {quote.costs && quote.costs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800 text-sm">Included Costs</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {quote.costs.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-slate-700">{cost.label}</span>
                    <span className="font-mono text-slate-800">{formatCurrency(Number(cost.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profitability */}
          {result && (
            <div>
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Profitability Analysis</h3>
              <CostingPanel result={result} currency={quote.currency} showBreakdown={true} />
            </div>
          )}
        </div>

        {/* Right column — status + timeline */}
        <div className="space-y-5">
          {/* Status Actions */}
          {allowedTransitions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Move Quote</h3>
              <div className="space-y-2">
                {allowedTransitions.map((toStatus) => (
                  <button
                    key={toStatus}
                    id={`status-${toStatus}`}
                    onClick={() => handleStatusTransition(toStatus)}
                    disabled={statusUpdating}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <span>{STATUS_LABELS[toStatus]}</span>
                    {statusUpdating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Status History</h3>
            {quote.statusHistory && quote.statusHistory.length > 0 ? (
              <StatusTimeline history={quote.statusHistory} currentStatus={quote.status} />
            ) : (
              <p className="text-xs text-slate-400">No history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
