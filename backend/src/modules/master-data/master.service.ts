import { prisma } from '../../config/db';
import type {
  CreateCurrencyRateInput,
  CreateFreightTemplateInput,
  UpsertPortChargeInput,
} from './master.schema';

// Static data constants (no DB needed)
export const INCOTERMS = ['EXW', 'FOB', 'CIF', 'CFR', 'DDP'] as const;

export const ORIGIN_PORTS = [
  'Nhava Sheva (JNPT)',
  'Chennai Port',
  'Mundra Port',
  'Kolkata Port',
];

export const INCOTERM_INCLUSIONS = {
  EXW: {
    included: ['product'],
    excluded: ['inland', 'cha', 'port', 'customs', 'freight', 'insurance', 'export_duty'],
  },
  FOB: {
    included: ['product', 'inland', 'cha', 'port', 'customs', 'export_duty'],
    excluded: ['freight', 'insurance'],
  },
  CFR: {
    included: ['product', 'inland', 'cha', 'port', 'customs', 'export_duty', 'freight'],
    excluded: ['insurance'],
  },
  CIF: {
    included: ['product', 'inland', 'cha', 'port', 'customs', 'export_duty', 'freight', 'insurance'],
    excluded: [],
  },
  DDP: {
    included: ['ALL'],
    excluded: [],
  },
} as const;

// ─── Currency Rates ───────────────────────────────────────────────────────────

export async function getCurrencyRates() {
  return prisma.currencyRate.findMany({
    orderBy: { lockedDate: 'desc' },
  });
}

export async function getLatestCurrencyRate(from: string, to: string) {
  return prisma.currencyRate.findFirst({
    where: { fromCurrency: from as never, toCurrency: to as never },
    orderBy: { lockedDate: 'desc' },
  });
}

export async function createCurrencyRate(data: CreateCurrencyRateInput) {
  return prisma.currencyRate.create({ data: { ...data, lockedDate: new Date() } });
}

// ─── Freight Templates ────────────────────────────────────────────────────────

export async function getFreightTemplates(destinationCountry?: string, isActive = true) {
  return prisma.freightTemplate.findMany({
    where: {
      isActive,
      ...(destinationCountry
        ? { destinationCountry: { contains: destinationCountry, mode: 'insensitive' } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFreightTemplate(data: CreateFreightTemplateInput) {
  return prisma.freightTemplate.create({
    data: {
      ...data,
      validFrom: new Date(data.validFrom),
      validTo: data.validTo ? new Date(data.validTo) : undefined,
      freightCost20ft: data.freightCost20ft,
      freightCost40ft: data.freightCost40ft,
    },
  });
}

// ─── Port Charges ─────────────────────────────────────────────────────────────

export async function getPortCharges() {
  return prisma.portChargeTemplate.findMany({
    where: { isActive: true },
    orderBy: { portName: 'asc' },
  });
}

export async function upsertPortCharge(data: UpsertPortChargeInput) {
  return prisma.portChargeTemplate.upsert({
    where: { portName: data.portName },
    update: data,
    create: data,
  });
}

// ─── Static Data ─────────────────────────────────────────────────────────────

export function getStaticData() {
  return {
    incoterms: INCOTERMS,
    originPorts: ORIGIN_PORTS,
    incotermInclusions: INCOTERM_INCLUSIONS,
  };
}
