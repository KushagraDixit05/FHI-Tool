'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import type { ProductLine, CurrencyRate, FreightTemplate, PortChargeTemplate } from '@/types';

interface MasterDataStore {
  productLines: ProductLine[];
  currencies: CurrencyRate[];
  freightTemplates: FreightTemplate[];
  portCharges: PortChargeTemplate[];
  isLoaded: boolean;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  fetchProductLines: () => Promise<void>;
  fetchCurrencies: () => Promise<void>;
  fetchFreightTemplates: () => Promise<void>;
}

export const useMasterDataStore = create<MasterDataStore>()((set, get) => ({
  productLines: [],
  currencies: [],
  freightTemplates: [],
  portCharges: [],
  isLoaded: false,
  isLoading: false,

  fetchAll: async () => {
    if (get().isLoaded || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [linesRes, currenciesRes, freightRes, portRes] = await Promise.all([
        api.get('/products/lines'),
        api.get('/master/currencies'),
        api.get('/master/freight-templates'),
        api.get('/master/port-charges'),
      ]);
      set({
        productLines: linesRes.data,
        currencies: currenciesRes.data,
        freightTemplates: freightRes.data,
        portCharges: portRes.data,
        isLoaded: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProductLines: async () => {
    const res = await api.get('/products/lines');
    set({ productLines: res.data });
  },

  fetchCurrencies: async () => {
    const res = await api.get('/master/currencies');
    set({ currencies: res.data });
  },

  fetchFreightTemplates: async () => {
    const res = await api.get('/master/freight-templates');
    set({ freightTemplates: res.data });
  },
}));
