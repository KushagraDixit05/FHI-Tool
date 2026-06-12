'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui';
import { useQuoteBuilder } from '@/hooks/useQuoteBuilder';

// Step components
import { StepBuyer } from '@/components/quotes/QuoteBuilder/StepBuyer';
import { StepSettings } from '@/components/quotes/QuoteBuilder/StepSettings';
import { StepProducts } from '@/components/quotes/QuoteBuilder/StepProducts';
import { StepLogistics } from '@/components/quotes/QuoteBuilder/StepLogistics';
import { StepOperational } from '@/components/quotes/QuoteBuilder/StepOperational';
import { StepReview } from '@/components/quotes/QuoteBuilder/StepReview';

const STEPS = [
  { number: 1, label: 'Buyer' },
  { number: 2, label: 'Settings' },
  { number: 3, label: 'Products' },
  { number: 4, label: 'Logistics' },
  { number: 5, label: 'Operations' },
  { number: 6, label: 'Review' },
];

export default function NewQuotePage() {
  const router = useRouter();
  const qb = useQuoteBuilder();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const { state } = qb;
      const payload = {
        buyerId: state.buyerId,
        incoterm: state.incoterm,
        currency: state.currency,
        exchangeRate: state.exchangeRate,
        fxBuffer: state.fxBuffer,
        notes: state.notes || undefined,
        internalNotes: state.internalNotes || undefined,
        validUntil: state.validUntil || undefined,
        items: state.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitSupplierCost: item.unitSupplierCost,
          packagingCostPerUnit: item.packagingCostPerUnit,
          labelingCostPerUnit: item.labelingCostPerUnit,
          qcCostPerUnit: item.qcCostPerUnit,
          samplingCost: item.samplingCost,
          toolingCost: item.toolingCost,
          marginPercent: item.marginPercent,
          // Computed totals (will be recalculated server-side too)
          totalProductCostInr:
            (item.unitSupplierCost +
              item.packagingCostPerUnit +
              item.labelingCostPerUnit +
              item.qcCostPerUnit +
              (item.samplingCost + item.toolingCost) / item.quantity) *
            item.quantity,
          unitSellingPrice: item.unitSupplierCost * (1 + item.marginPercent / 100),
          totalLineValue:
            item.unitSupplierCost * (1 + item.marginPercent / 100) * item.quantity,
        })),
        costs: [
          { category: 'LOGISTICS', label: 'Inland Transport', amount: state.inlandTransport, isIncluded: true, isOptional: false },
          { category: 'LOGISTICS', label: 'Customs Clearance', amount: state.customsClearance, isIncluded: true, isOptional: false },
          { category: 'LOGISTICS', label: 'Fumigation', amount: state.fumigation, isIncluded: true, isOptional: true },
          { category: 'LOGISTICS', label: 'Palletization', amount: state.palletization, isIncluded: true, isOptional: true },
          { category: 'LOGISTICS', label: 'Warehousing', amount: state.warehousing, isIncluded: true, isOptional: true },
          { category: 'LOGISTICS', label: 'Container Cost', amount: state.containerCost, isIncluded: true, isOptional: false },
          ...(state.freightTemplate
            ? [
                { category: 'LOGISTICS', label: 'Sea Freight', amount: Number(state.freightTemplate.freightCost20ft), isIncluded: true, isOptional: false },
              ]
            : []),
          ...(state.portChargeTemplate
            ? [
                { category: 'LOGISTICS', label: 'CHA Charges', amount: Number(state.portChargeTemplate.chaCharges), isIncluded: true, isOptional: false },
                { category: 'LOGISTICS', label: 'Port Charges', amount: Number(state.portChargeTemplate.portCharges), isIncluded: true, isOptional: false },
                { category: 'LOGISTICS', label: 'Handling Charges', amount: Number(state.portChargeTemplate.handlingCharges), isIncluded: true, isOptional: false },
                { category: 'LOGISTICS', label: 'Document Charges', amount: Number(state.portChargeTemplate.documentCharges), isIncluded: true, isOptional: false },
              ]
            : []),
          { category: 'OPERATIONAL', label: 'Bank Charges', amount: state.bankCharges, isIncluded: true, isOptional: false },
          { category: 'OPERATIONAL', label: 'Currency Conversion Buffer', amount: state.currencyConversionBuffer, isIncluded: true, isOptional: false },
          { category: 'OPERATIONAL', label: 'Platform Admin Cost', amount: state.platformAdminCost, isIncluded: true, isOptional: false },
          { category: 'OPERATIONAL', label: 'Travel Cost Allocation', amount: state.travelCostAllocation, isIncluded: true, isOptional: true },
          { category: 'OPERATIONAL', label: 'Communication Cost', amount: state.communicationCost, isIncluded: true, isOptional: true },
          { category: 'OPERATIONAL', label: 'Agent Commission', amount: state.agentCommission, isIncluded: true, isOptional: true },
          { category: 'OPERATIONAL', label: 'Misc Buffer', amount: state.miscBuffer, isIncluded: true, isOptional: true },
        ].filter((c) => c.amount > 0),
      };
      const res = await api.post('/quotes', payload);
      toast.success(`Quote ${res.data.quoteNumber} created!`);
      router.push(`/quotes/${res.data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create quote';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [qb, router]);

  const stepComponents = [
    <StepBuyer key={1} qb={qb} />,
    <StepSettings key={2} qb={qb} />,
    <StepProducts key={3} qb={qb} />,
    <StepLogistics key={4} qb={qb} />,
    <StepOperational key={5} qb={qb} />,
    <StepReview key={6} qb={qb} onSubmit={handleSubmit} submitting={submitting} />,
  ];

  const canAdvance = (): boolean => {
    const { state, currentStep } = qb;
    if (currentStep === 1) return !!state.buyerId;
    if (currentStep === 2) return !!state.incoterm && !!state.currency && state.exchangeRate > 0;
    if (currentStep === 3) return state.items.length > 0;
    return true;
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">New Quote</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Step {qb.currentStep} of {STEPS.length} — {STEPS[qb.currentStep - 1]?.label}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const done = qb.currentStep > step.number;
          const active = qb.currentStep === step.number;
          return (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => done && qb.goToStep(step.number)}
                disabled={!done}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : done
                    ? 'text-emerald-600 cursor-pointer hover:bg-emerald-50'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    active
                      ? 'bg-white text-slate-900'
                      : done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : step.number}
                </span>
                {step.label}
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-96">{stepComponents[qb.currentStep - 1]}</div>

      {/* Navigation */}
      {qb.currentStep < 6 && (
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => qb.currentStep === 1 ? router.push('/quotes') : qb.goToStep(qb.currentStep - 1)}
          >
            {qb.currentStep === 1 ? 'Cancel' : '← Back'}
          </Button>
          <Button onClick={() => qb.goToStep(qb.currentStep + 1)} disabled={!canAdvance()}>
            Continue →
          </Button>
        </div>
      )}
    </div>
  );
}
