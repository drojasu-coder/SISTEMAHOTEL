export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public details?: unknown;
    public isOperational: boolean;
    public cause?: unknown;

    constructor(
        statusCode: number,
        code: string,
        message: string,
        details?: unknown,
        cause?: unknown,
    ){
        super(message);
        this.name = "AppError";

        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        this.cause = cause;

        Error.captureStackTrace(this, this.constructor);
    }
}