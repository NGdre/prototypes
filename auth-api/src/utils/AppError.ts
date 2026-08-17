// Operational errors: carry their own HTTP status, so the error handler does
// not have to guess the response code from a string match on the message
// (that approach silently breaks whenever a message is reworded).
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code ?? "APP_ERROR";
    Error.captureStackTrace?.(this, this.constructor);
  }
}