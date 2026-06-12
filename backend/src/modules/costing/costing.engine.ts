// Types inlined from shared/types — avoids rootDir constraint
export type ProfitabilityScore = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'LOW' | 'CRITICAL';
export type Incoterm = 'EXW' | 'FOB' | 'CIF' | 'CFR' | 'DDP';

export interface CostingInput {
  quantity: number;
  unitSupplierCost: number;
  packagingCostPerUnit: number;
  labelingCostPerUnit: number;
  qcCostPerUnit: number;
  samplingCost: number;
  toolingCost: number;
  inlandTransport: number;
  freightCost: number;
  chaCharges: number;
  portCharges: number;
  customsClearance: number;
  documentCharges: number;
  palletization: number;
  fumigation: number;
  warehousing: number;
  insurance: number;
  containerCost: number;
  handlingCharges: number;
  exportDuty: number;
  inspectionCharges: number;
  bankCharges: number;
  currencyConversionBuffer: number;
  platformAdminCost: number;
  travelCostAllocation: number;
  communicationCost: number;
  agentCommission: number;
  miscBuffer: number;
  marginPercent: number;
  riskBufferPercent: number;
  exchangeRate: number;
  fxBufferPercent: number;
  incoterm: Incoterm;
}

export interface CostingResult {
  unitProductCost: number;
  unitLogisticsCost: number;
  unitOperationalCost: number;
  unitTotalCostBeforeMargin: number;
  unitMarginAmount: number;
  unitSellingPriceInr: number;
  unitSellingPriceForeign: number;
  totalProductCost: number;
  totalLogisticsCost: number;
  totalOperationalCost: number;
  totalCostBeforeMargin: number;
  totalMarginAmount: number;
  totalSellingPriceInr: number;
  totalSellingPriceForeign: number;
  netProfit: number;
  profitPerUnit: number;
  profitabilityScore: ProfitabilityScore;
  effectiveMarginPercent: number;
  includedCosts: { label: string; amount: number; category: string }[];
  excludedCosts: { label: string; amount: number; reason: string }[];
}

// ─── Incoterm Cost Inclusions ─────────────────────────────────────────────────

type LogisticsKey =
  | 'inland'
  | 'freight'
  | 'cha'
  | 'port'
  | 'customs'
  | 'documents'
  | 'palletization'
  | 'fumigation'
  | 'warehousing'
  | 'insurance'
  | 'container'
  | 'handling'
  | 'export_duty'
  | 'inspection';

const INCOTERM_INCLUDED_KEYS: Record<string, LogisticsKey[] | 'ALL'> = {
  EXW: [], // seller only makes goods available — buyer handles everything
  FOB: ['inland', 'cha', 'port', 'customs', 'export_duty', 'documents', 'handling'],
  CFR: ['inland', 'cha', 'port', 'customs', 'export_duty', 'documents', 'handling', 'freight', 'container'],
  CIF: ['inland', 'cha', 'port', 'customs', 'export_duty', 'documents', 'handling', 'freight', 'container', 'insurance'],
  DDP: 'ALL',
};

// ─── Profitability Score ──────────────────────────────────────────────────────

function scoreProfitability(marginPercent: number): ProfitabilityScore {
  if (marginPercent >= 25) return 'EXCELLENT';
  if (marginPercent >= 18) return 'GOOD';
  if (marginPercent >= 12) return 'ACCEPTABLE';
  if (marginPercent >= 8) return 'LOW';
  return 'CRITICAL';
}

// ─── Container Calculator ─────────────────────────────────────────────────────

export interface ContainerCalcInput {
  quantity: number;
  unitsPerCarton: number;
  cartonLCm: number;
  cartonWCm: number;
  cartonHCm: number;
  cartonWeightKg: number;
}

export interface ContainerCalcResult {
  totalCartons: number;
  totalCbm: number;
  totalWeightKg: number;
  containers20ft: number;
  containers40ft: number;
  containerUtilization20ft: number; // percentage
}

export function calculateContainerNeeds(input: ContainerCalcInput): ContainerCalcResult {
  const totalCartons = Math.ceil(input.quantity / input.unitsPerCarton);
  const cartonCbm = (input.cartonLCm * input.cartonWCm * input.cartonHCm) / 1_000_000;
  const totalCbm = cartonCbm * totalCartons;
  const totalWeightKg = input.cartonWeightKg * totalCartons;

  const MAX_CBM_20FT = 26;
  const MAX_CBM_40FT = 56;

  const containers20ft = Math.ceil(totalCbm / MAX_CBM_20FT);
  const containers40ft = Math.ceil(totalCbm / MAX_CBM_40FT);
  const containerUtilization20ft = Math.min(100, (totalCbm / MAX_CBM_20FT) * 100);

  return {
    totalCartons,
    totalCbm: Math.round(totalCbm * 10000) / 10000,
    totalWeightKg: Math.round(totalWeightKg * 100) / 100,
    containers20ft,
    containers40ft,
    containerUtilization20ft: Math.round(containerUtilization20ft * 10) / 10,
  };
}

// ─── Core Costing Engine ──────────────────────────────────────────────────────

export function calculateCosting(input: CostingInput): CostingResult {
  const {
    quantity,
    unitSupplierCost,
    packagingCostPerUnit,
    labelingCostPerUnit,
    qcCostPerUnit,
    samplingCost,
    toolingCost,
    inlandTransport,
    freightCost,
    chaCharges,
    portCharges,
    customsClearance,
    documentCharges,
    palletization,
    fumigation,
    warehousing,
    insurance,
    containerCost,
    handlingCharges,
    exportDuty,
    inspectionCharges,
    bankCharges,
    currencyConversionBuffer,
    platformAdminCost,
    travelCostAllocation,
    communicationCost,
    agentCommission,
    miscBuffer,
    marginPercent,
    riskBufferPercent,
    exchangeRate,
    fxBufferPercent,
    incoterm,
  } = input;

  // ─── Step 1: Product cost per unit ──────────────────────────────────────────
  const amortizedOneTimeCost = (samplingCost + toolingCost) / quantity;
  const productCostPerUnit =
    unitSupplierCost +
    packagingCostPerUnit +
    labelingCostPerUnit +
    qcCostPerUnit +
    amortizedOneTimeCost;
  const totalProductCost = productCostPerUnit * quantity;

  // ─── Step 2: Filter logistics by incoterm ───────────────────────────────────
  const allLogistics: Record<LogisticsKey, { label: string; amount: number }> = {
    inland:       { label: 'Inland Transport',         amount: inlandTransport },
    freight:      { label: 'Sea Freight',              amount: freightCost },
    cha:          { label: 'CHA Charges',              amount: chaCharges },
    port:         { label: 'Port Charges',             amount: portCharges },
    customs:      { label: 'Customs Clearance',        amount: customsClearance },
    documents:    { label: 'Document Charges',         amount: documentCharges },
    palletization:{ label: 'Palletization',            amount: palletization },
    fumigation:   { label: 'Fumigation',               amount: fumigation },
    warehousing:  { label: 'Warehousing',              amount: warehousing },
    insurance:    { label: 'Cargo Insurance',          amount: insurance },
    container:    { label: 'Container Cost',           amount: containerCost },
    handling:     { label: 'Handling Charges',         amount: handlingCharges },
    export_duty:  { label: 'Export Duty',              amount: exportDuty },
    inspection:   { label: 'Inspection Charges',       amount: inspectionCharges },
  };

  const included = INCOTERM_INCLUDED_KEYS[incoterm];
  const includedCosts: CostingResult['includedCosts'] = [];
  const excludedCosts: CostingResult['excludedCosts'] = [];
  let totalLogisticsCost = 0;

  for (const [key, { label, amount }] of Object.entries(allLogistics) as [LogisticsKey, { label: string; amount: number }][]) {
    const isIncluded = included === 'ALL' || (included as LogisticsKey[]).includes(key);
    if (isIncluded) {
      totalLogisticsCost += amount;
      includedCosts.push({ label, amount, category: 'LOGISTICS' });
    } else {
      excludedCosts.push({ label, amount, reason: `Not included under ${incoterm}` });
    }
  }

  // ─── Step 3: Operational costs ──────────────────────────────────────────────
  const totalOperationalCost =
    bankCharges +
    currencyConversionBuffer +
    platformAdminCost +
    travelCostAllocation +
    communicationCost +
    agentCommission +
    miscBuffer;

  // ─── Step 4: Total cost before margin ───────────────────────────────────────
  const totalCostBeforeMargin = totalProductCost + totalLogisticsCost + totalOperationalCost;

  // ─── Step 5: Margin + risk buffer ───────────────────────────────────────────
  const combinedMarginPercent = marginPercent + riskBufferPercent;
  const totalMarginAmount = (totalCostBeforeMargin * combinedMarginPercent) / 100;
  const totalSellingPriceInr = totalCostBeforeMargin + totalMarginAmount;

  // ─── Step 6: FX conversion ──────────────────────────────────────────────────
  // FX buffer reduces effective rate — protects against currency movement
  const effectiveRate = exchangeRate * (1 - fxBufferPercent / 100);
  const totalSellingPriceForeign = effectiveRate > 0 ? totalSellingPriceInr / effectiveRate : 0;

  // ─── Step 7: Per unit breakdown ─────────────────────────────────────────────
  const unitSellingPriceInr = totalSellingPriceInr / quantity;
  const unitSellingPriceForeign = totalSellingPriceForeign / quantity;
  const unitLogisticsCost = totalLogisticsCost / quantity;
  const unitOperationalCost = totalOperationalCost / quantity;
  const unitTotalCostBeforeMargin = totalCostBeforeMargin / quantity;
  const unitMarginAmount = totalMarginAmount / quantity;

  // ─── Step 8: Profitability ──────────────────────────────────────────────────
  const profitabilityScore = scoreProfitability(combinedMarginPercent);
  const netProfit = totalMarginAmount;
  const profitPerUnit = unitMarginAmount;

  return {
    unitProductCost: round(productCostPerUnit),
    unitLogisticsCost: round(unitLogisticsCost),
    unitOperationalCost: round(unitOperationalCost),
    unitTotalCostBeforeMargin: round(unitTotalCostBeforeMargin),
    unitMarginAmount: round(unitMarginAmount),
    unitSellingPriceInr: round(unitSellingPriceInr),
    unitSellingPriceForeign: round4(unitSellingPriceForeign),
    totalProductCost: round(totalProductCost),
    totalLogisticsCost: round(totalLogisticsCost),
    totalOperationalCost: round(totalOperationalCost),
    totalCostBeforeMargin: round(totalCostBeforeMargin),
    totalMarginAmount: round(totalMarginAmount),
    totalSellingPriceInr: round(totalSellingPriceInr),
    totalSellingPriceForeign: round4(totalSellingPriceForeign),
    netProfit: round(netProfit),
    profitPerUnit: round(profitPerUnit),
    profitabilityScore,
    effectiveMarginPercent: round(combinedMarginPercent),
    includedCosts,
    excludedCosts,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
