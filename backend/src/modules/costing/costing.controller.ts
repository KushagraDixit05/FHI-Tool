import { calculateCosting, calculateContainerNeeds, type CostingInput } from './costing.engine';
import { INCOTERM_INCLUSIONS } from '../master-data/master.service';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { badRequest } from '../../shared/errors/AppError';

const VALID_INCOTERMS = ['EXW', 'FOB', 'CIF', 'CFR', 'DDP'] as const;

export const calculate = asyncHandler(async (req, res) => {
  res.json(calculateCosting(req.body as CostingInput));
});

export const getIncotermCosts = asyncHandler(async (req, res) => {
  const { incoterm } = req.params;
  if (!VALID_INCOTERMS.includes(incoterm as (typeof VALID_INCOTERMS)[number])) {
    throw badRequest(`Invalid incoterm. Must be one of: ${VALID_INCOTERMS.join(', ')}`);
  }
  const inclusion = INCOTERM_INCLUSIONS[incoterm as keyof typeof INCOTERM_INCLUSIONS];
  res.json({ incoterm, included: inclusion?.included, excluded: inclusion?.excluded });
});

export const containerCalc = asyncHandler(async (req, res) => {
  res.json(calculateContainerNeeds(req.body));
});
