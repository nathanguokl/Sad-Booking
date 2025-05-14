import { TicketMasterError } from "./ticketmaster.error.ts"

export class BookingError extends TicketMasterError {
    constructor(message: string, metadata?: Record<string, any>) {
        super(message, metadata);
        this.name = "Booking Error";
    }
}