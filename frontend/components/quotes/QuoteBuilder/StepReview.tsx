'use client';

import { useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button, Card } from '@/components/ui';
import { CostingPanel } from '@/components/costing/CostingPanel';
import { useCosting } from '@/hooks/useCosting';
import type { UseQuoteBuilderReturn } from '@/hooks/useQuoteBuilder';
import type { CostingInput } from '@/types';

interface StepReviewProps {
  qb: UseQuoteBuilderReturn;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}

export function StepReview({ qb, onSubmit, submitting }: StepReviewProps) {
  const { state } = qb;
  const { result, loading: calcLoading, calculate } = useCosting();

  // Build costing input from first item + shared logistics
  const buildCostingInput = useCallback((): CostingInput | null => {
    const firstItem = state.items[0];
    if (!firstItem || !state.exchangeRate || !state.incoterm) return null;

    const totalQty = state.items.reduce((s, i) => s + i.quantity, 0);
    const totalProductCost = state.items.reduce(
      (s, i) => s + (i.unitSupplierCost + i.packagingCostPerUnit + i.labelingCostPerUnit + i.qcCostPerUnit) * i.quantity,
      0
    );
    const avgUnitCost = totalProductCost / totalQty;
    const avgMargin = state.items.reduce((s, i) => s + i.marginPercent, 0) / state.items.length;

    return {
      quantity: totalQty,
      unitSupplierCost: avgUnitCost,
      packagingCostPerUnit: 0,
      labelingCostPerUnit: 0,
      qcCostPerUnit: 0,
      samplingCost: 0,
      toolingCost: 0,
      inlandTransport: state.inlandTransport,
      freightCost: Number(state.freightTemplate?.freightCost20ft ?? 0),
      chaCharges: Number(state.portChargeTemplate?.chaCharges ?? 0),
      portCharges: Number(state.portChargeTemplate?.portCharges ?? 0),
      customsClearance: state.customsClearance,
      documentCharges: Number(state.portChargeTemplate?.documentCharges ?? 0),
      palletization: state.palletization,
      fumigation: state.fumigation,
      warehousing: state.warehousing,
      insurance: 0,
      containerCost: state.containerCost,
      handlingCharges: Number(state.portChargeTemplate?.handlingCharges ?? 0),
      exportDuty: 0,
      inspectionCharges: 0,
      bankCharges: state.bankCharges,
      currencyConversionBuffer: state.currencyConversionBuffer,
      platformAdminCost: state.platformAdminCost,
      travelCostAllocation: state.travelCostAllocation,
      communicationCost: state.communicationCost,
      agentCommission: state.agentCommission,
      miscBuffer: state.miscBuffer,
      marginPercent: avgMargin,
      riskBufferPercent: state.riskBufferPercent,
      exchangeRate: state.exchangeRate,
      fxBufferPercent: state.fxBuffer,
      incoterm: state.incoterm as never,
    };
  }, [state]);

  useEffect(() => {
    const input = buildCostingInput();
    if (input) calculate(input);
  }, [buildCostingInput, calculate]);

  const totalLineValue = state.items.reduce(
    (s, i) => s + i.unitSupplierCost * (1 + i.marginPercent / 100) * i.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Review & Submit</h2>
        <p className="text-sm text-slate-500">Review the quote summary and profitability before creating.</p>
      </div>

      {/* Quote Overview */}
      <Card className="p-5">
        <h3 className="font-medium text-slate-800 text-sm mb-4">Quote Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Buyer</div>
            <div className="font-semibold text-slate-900">{state.buyer?.companyName ?? '—'}</div>
            <div className="text-xs text-slate-500">{state.buyer?.country}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Incoterm</div>
            <div className="font-mono font-bold text-slate-900">{state.incoterm}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Currency</div>
            <div className="font-semibold text-slate-900">{state.currency}</div>
            <div className="text-xs text-slate-500">@ ₹{state.exchangeRate}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Products</div>
            <div className="font-semibold text-slate-900">{state.items.length} SKU(s)</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Valid Until</div>
            <div className="font-semibold text-slate-900">{state.validUntil || 'No expiry set'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Est. Total Value</div>
            <div className="font-bold text-slate-900">{formatCurrency(totalLineValue)}</div>
          </div>
        </div>
      </Card>

      {/* Products Summary */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="font-medium text-slate-800 text-sm">Products in Quote</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {state.items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="font-mono text-xs text-slate-500">{item.product.productCode}</div>
                <div className="text-sm font-medium text-slate-800">{item.product.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Qty: {item.quantity.toLocaleString()}</div>
                <div className="text-sm font-semibold text-slate-800">
                  {formatCurrency(item.unitSupplierCost * (1 + item.marginPercent / 100) * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Profitability Preview */}
      <div>
        <h3 className="font-medium text-slate-800 text-sm mb-3 flex items-center gap-2">
          Profitability Analysis
          {calcLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </h3>
        {result ? (
          <CostingPanel result={result} currency={state.currency} showBreakdown={true} />
        ) : (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            {calcLoading ? 'Calculating…' : 'Add products and costs to see profitability analysis.'}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={() => qb.goToStep(5)}>
          ← Back
        </Button>
        <Button
          id="submit-quote-btn"
          onClick={onSubmit}
          loading={submitting}
          disabled={!state.buyerId || state.items.length === 0}
        >
          Create Quote →
        </Button>
      </div>
    </div>
  );
}
