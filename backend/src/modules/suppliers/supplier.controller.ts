import * as supplierService from './supplier.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  res.json(await supplierService.listSuppliers(req.query as never));
});

export const getById = asyncHandler(async (req, res) => {
  res.json(await supplierService.getSupplierById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await supplierService.createSupplier(req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await supplierService.updateSupplier(req.params.id, req.body));
});

export const softDelete = asyncHandler(async (req, res) => {
  await supplierService.softDeleteSupplier(req.params.id);
  res.json({ message: 'Supplier deactivated successfully' });
});
