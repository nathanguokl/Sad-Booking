import { TicketMasterError } from "./ticketmaster.error.ts";

export class SeatValidationError extends TicketMasterError {
    constructor(message: string, metadata?: Record<string, any>) {
        super(message, metadata);
        this.name = 'Seat Validation Error'
    }
}