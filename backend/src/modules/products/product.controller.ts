import * as productService from './product.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const getLines = asyncHandler(async (_req, res) => {
  res.json(await productService.getProductLines());
});

export const getCategoriesByLine = asyncHandler(async (req, res) => {
  res.json(await productService.getCategoriesByLine(req.params.lineId));
});

export const getTypesByCategory = asyncHandler(async (req, res) => {
  res.json(await productService.getTypesByCategory(req.params.categoryId));
});

export const list = asyncHandler(async (req, res) => {
  res.json(await productService.listProducts(req.query as never));
});

export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q as string) || '';
  res.json(await productService.searchProducts(q));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await productService.getProductById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await productService.createProduct(req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await productService.updateProduct(req.params.id, req.body));
});
