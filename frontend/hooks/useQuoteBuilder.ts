'use client';

import { useState, useCallback } from 'react';
import type { Buyer, Product, FreightTemplate, PortChargeTemplate, CurrencyRate, Incoterm, Currency } from '@/types';

export interface QuoteBuilderState {
  // Step 1: Buyer
  buyer: Buyer | null;
  buyerId: string;

  // Step 2: Settings
  incoterm: Incoterm;
  currency: Currency;
  exchangeRate: number;
  fxBuffer: number;
  validUntil: string;
  notes: string;
  internalNotes: string;

  // Step 3: Products
  items: QuoteBuilderItem[];

  // Step 4: Logistics
  freightTemplate: FreightTemplate | null;
  portChargeTemplate: PortChargeTemplate | null;
  inlandTransport: number;
  customsClearance: number;
  fumigation: number;
  palletization: number;
  warehousing: number;
  containerCost: number;

  // Step 5: Operational
  bankCharges: number;
  currencyConversionBuffer: number;
  platformAdminCost: number;
  travelCostAllocation: number;
  communicationCost: number;
  agentCommission: number;
  miscBuffer: number;
  riskBufferPercent: number;
}

export interface QuoteBuilderItem {
  product: Product;
  quantity: number;
  unitSupplierCost: number;
  packagingCostPerUnit: number;
  labelingCostPerUnit: number;
  qcCostPerUnit: number;
  samplingCost: number;
  toolingCost: number;
  marginPercent: number;
}

const DEFAULT_STATE: QuoteBuilderState = {
  buyer: null,
  buyerId: '',
  incoterm: 'FOB',
  currency: 'AUD',
  exchangeRate: 55,
  fxBuffer: 2,
  validUntil: '',
  notes: '',
  internalNotes: '',
  items: [],
  freightTemplate: null,
  portChargeTemplate: null,
  inlandTransport: 0,
  customsClearance: 0,
  fumigation: 0,
  palletization: 0,
  warehousing: 0,
  containerCost: 0,
  bankCharges: 0,
  currencyConversionBuffer: 0,
  platformAdminCost: 0,
  travelCostAllocation: 0,
  communicationCost: 0,
  agentCommission: 0,
  miscBuffer: 0,
  riskBufferPercent: 3,
};

/**
 * Manages the multi-step quote builder state across all 6 wizard steps.
 */
export function useQuoteBuilder() {
  const [state, setState] = useState<QuoteBuilderState>(DEFAULT_STATE);
  const [currentStep, setCurrentStep] = useState(1);

  const update = useCallback(<K extends keyof QuoteBuilderState>(
    key: K,
    value: QuoteBuilderState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateMany = useCallback((updates: Partial<QuoteBuilderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const addItem = useCallback((item: QuoteBuilderItem) => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.product.id !== productId),
    }));
  }, []);

  const updateItem = useCallback((productId: string, updates: Partial<QuoteBuilderItem>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.product.id === productId ? { ...i, ...updates } : i
      ),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(6, step)));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    setCurrentStep(1);
  }, []);

  return {
    state,
    currentStep,
    update,
    updateMany,
    addItem,
    removeItem,
    updateItem,
    goToStep,
    reset,
  };
}

export type UseQuoteBuilderReturn = ReturnType<typeof useQuoteBuilder>;
