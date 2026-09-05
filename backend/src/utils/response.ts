import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
  const responsePayload: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    responsePayload.message = message;
  }
  return res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
) {
  const responsePayload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(responsePayload);
}
