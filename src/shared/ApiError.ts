export class ApiError extends Error {
    statusCode: number;
    statusText: string;

    constructor(statusCode: number, statusText: string) {
        super();
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
}