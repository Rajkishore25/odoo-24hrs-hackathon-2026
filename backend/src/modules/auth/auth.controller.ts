import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse } from '../../utils/response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, result, 'Login successful');
  } catch (err) { next(err); }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    return successResponse(res, user);
  } catch (err) { next(err); }
}

export async function createAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.createAccount(req.body, req.user!.role);
    return successResponse(res, result, 'Account created successfully', 201);
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.changePassword(req.user!.userId, req.body);
    return successResponse(res, result);
  } catch (err) { next(err); }
}
