import { logger } from "../utils/logger.util.ts";

export class TicketMasterError extends Error {
    timestamp: string;
    metadata?: Record<string, any>;

    constructor(message: string, metadata?: Record<string, any>) {
        super(message);
        this.name = 'TicketMasterError';
        this.timestamp = new Date().toISOString();
        this.metadata = metadata;

        logger.error(message, metadata);
    }

    toJSON(): string {
        return JSON.stringify({
            name: this.name,
            message: this.message,
            timestamp: this.timestamp,
            metadata: this.metadata
        })
    }
}