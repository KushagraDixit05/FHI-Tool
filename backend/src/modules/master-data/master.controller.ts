import * as masterService from './master.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const getCurrencyRates = asyncHandler(async (_req, res) => {
  res.json(await masterService.getCurrencyRates());
});

export const createCurrencyRate = asyncHandler(async (req, res) => {
  res.status(201).json(await masterService.createCurrencyRate(req.body));
});

export const getFreightTemplates = asyncHandler(async (req, res) => {
  const { destinationCountry, isActive } = req.query as Record<string, string>;
  const active = isActive !== 'false';
  res.json(await masterService.getFreightTemplates(destinationCountry, active));
});

export const createFreightTemplate = asyncHandler(async (req, res) => {
  res.status(201).json(await masterService.createFreightTemplate(req.body));
});

export const getPortCharges = asyncHandler(async (_req, res) => {
  res.json(await masterService.getPortCharges());
});

export const upsertPortCharge = asyncHandler(async (req, res) => {
  res.json(await masterService.upsertPortCharge(req.body));
});

export const getStaticData = asyncHandler(async (_req, res) => {
  res.json(masterService.getStaticData());
});
