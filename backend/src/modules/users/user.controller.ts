import * as userService from './user.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const list = asyncHandler(async (_req, res) => {
  res.json(await userService.listUsers());
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await userService.createUser(req.body));
});

export const updateRole = asyncHandler(async (req, res) => {
  res.json(await userService.updateUserRole(req.params.id, req.body));
});

export const toggle = asyncHandler(async (req, res) => {
  res.json(await userService.toggleUserActive(req.params.id));
});
