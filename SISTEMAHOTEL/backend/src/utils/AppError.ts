export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public details?: unknown;
    public isOperational: boolean;

    constructor(
        statusCode: number,
        code: string,
        message: string,
        details?: unknown,
    ){
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}