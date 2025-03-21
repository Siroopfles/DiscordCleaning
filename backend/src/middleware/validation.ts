import { Request, Response, NextFunction } from 'express';
import { Result, ValidationError, validationResult } from 'express-validator';

interface FormattedError {
  field: string;
  message: string;
}

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const errors: Result<ValidationError> = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((error): FormattedError => ({
        field: error.type === 'field' ? error.path : 'general',
        message: error.msg
      }))
    });
  }
  next();
};