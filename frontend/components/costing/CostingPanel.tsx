'use client';

import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PROFITABILITY_COLORS } from '@/constants';
import type { CostingResult } from '@/types';

interface CostingPanelProps {
  result: CostingResult;
  currency?: string;
  showBreakdown?: boolean;
}

const SCORE_CONFIG = {
  EXCELLENT: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent Margin' },
  GOOD: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Good Margin' },
  ACCEPTABLE: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Acceptable Margin' },
  LOW: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Low Margin' },
  CRITICAL: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical — Below Break-even' },
};

function formatINR(amount: number): string {
  return formatCurrency(amount, 'INR', 'en-IN');
}

export function CostingPanel({ result, currency = 'AUD', showBreakdown = true }: CostingPanelProps) {
  const scoreConfig = SCORE_CONFIG[result.profitabilityScore];
  const ScoreIcon = scoreConfig.icon;

  return (
    <div className="space-y-4">
      {/* Profitability Score Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${scoreConfig.bg} ${scoreConfig.border}`}>
        <ScoreIcon className={`w-5 h-5 ${scoreConfig.color} flex-shrink-0`} />
        <div>
          <div className={`font-semibold text-sm ${scoreConfig.color}`}>{scoreConfig.label}</div>
          <div className="text-xs text-slate-600">
            Effective margin: {result.effectiveMarginPercent.toFixed(1)}% · Net profit per unit: {formatINR(result.profitPerUnit)}
          </div>
        </div>
      </div>

      {/* Key Price Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Unit Selling Price</div>
          <div className="text-xl font-bold text-slate-900">{formatINR(result.unitSellingPriceInr)}</div>
          <div className="text-sm text-slate-500 mt-0.5">
            {result.unitSellingPriceForeign.toFixed(4)} {currency}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Total Selling Price</div>
          <div className="text-xl font-bold text-slate-900">{formatINR(result.totalSellingPriceInr)}</div>
          <div className="text-sm text-slate-500 mt-0.5">
            {result.totalSellingPriceForeign.toFixed(2)} {currency}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Total Net Profit</div>
          <div className={`text-xl font-bold ${PROFITABILITY_COLORS[result.profitabilityScore]}`}>
            {formatINR(result.netProfit)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Total Cost (Before Margin)</div>
          <div className="text-xl font-bold text-slate-800">{formatINR(result.totalCostBeforeMargin)}</div>
        </div>
      </div>

      {/* Unit Cost Breakdown */}
      {showBreakdown && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-800">Cost Breakdown (Per Unit)</h4>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Product Cost', amount: result.unitProductCost, highlight: false },
              { label: 'Logistics Cost', amount: result.unitLogisticsCost, highlight: false },
              { label: 'Operational Cost', amount: result.unitOperationalCost, highlight: false },
              { label: 'Total Cost', amount: result.unitTotalCostBeforeMargin, highlight: true },
              { label: 'Margin', amount: result.unitMarginAmount, highlight: false },
              { label: 'Unit Selling Price', amount: result.unitSellingPriceInr, highlight: true },
            ].map(({ label, amount, highlight }) => (
              <div key={label} className={`flex justify-between items-center px-4 py-2.5 ${highlight ? 'bg-slate-50 font-semibold' : ''}`}>
                <span className="text-sm text-slate-700">{label}</span>
                <span className={`text-sm font-mono ${highlight ? 'text-slate-900' : 'text-slate-700'}`}>
                  {formatINR(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Included vs Excluded Costs */}
      {result.excludedCosts.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Excluded Under This Incoterm
          </h4>
          <div className="space-y-1.5">
            {result.excludedCosts.map((cost) => (
              <div key={cost.label} className="flex justify-between text-xs text-slate-500">
                <span>{cost.label}</span>
                <span className="font-mono">{formatINR(cost.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
