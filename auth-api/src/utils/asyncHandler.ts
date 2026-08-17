import { NextFunction, Request, Response } from "express";

// Req defaults to Request, so unauthenticated handlers keep their plain type;
// pass AuthenticatedRequest to get req.userId typed as string (the
// authenticate middleware guarantees it is set before such handlers run).
export const asyncHandler = <Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
};