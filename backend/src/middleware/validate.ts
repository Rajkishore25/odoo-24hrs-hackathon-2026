import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new ValidationError('Request validation failed', err.errors)
        );
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new ValidationError('Query validation failed', err.errors)
        );
      }
      next(err);
    }
  };
}
