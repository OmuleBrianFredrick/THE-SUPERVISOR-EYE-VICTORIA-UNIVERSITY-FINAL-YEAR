import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validate = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error instanceof ZodError || (error && Array.isArray(error.issues))) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues || error.errors,
        });
      }
      return res.status(500).json({ error: 'Internal server error during validation' });
    }
  };
};
