import * as quoteService from './quote.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  res.json(await quoteService.listQuotes(req.query as never));
});

export const getStats = asyncHandler(async (_req, res) => {
  res.json(await quoteService.getQuoteStats());
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await quoteService.getQuoteById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await quoteService.createQuote(req.body, req.user!.userId));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await quoteService.updateQuote(req.params.id, req.body, req.user!.userId));
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json(await quoteService.updateQuoteStatus(req.params.id, req.body, req.user!.userId));
});

export const remove = asyncHandler(async (req, res) => {
  await quoteService.deleteQuote(req.params.id);
  res.json({ message: 'Quote deleted successfully' });
});

export const duplicate = asyncHandler(async (req, res) => {
  res.status(201).json(await quoteService.duplicateQuote(req.params.id, req.user!.userId));
});
