import * as authService from './auth.service';
import { asyncHandler } from '../../shared/http/asyncHandler';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ message: 'Registration successful', ...result });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json({ message: 'Login successful', ...result });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user!.userId);
  res.status(200).json({ user });
});
