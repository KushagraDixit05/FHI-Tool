import * as buyerService from './buyer.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  res.json(await buyerService.listBuyers(req.query as never));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await buyerService.getBuyerById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await buyerService.createBuyer(req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await buyerService.updateBuyer(req.params.id, req.body));
});

export const softDelete = asyncHandler(async (req, res) => {
  await buyerService.softDeleteBuyer(req.params.id);
  res.json({ message: 'Buyer deactivated successfully' });
});

export const getQuotes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  res.json(await buyerService.getBuyerQuotes(req.params.id, page, limit));
});
