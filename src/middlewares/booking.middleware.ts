import { BookingError } from "../errors/booking.error";
import { Booking, Seat, SeatStatus } from "../types/ticketmaster.types";
import { convertSeatCode } from "../utils/seat.util";

export function validateBookingId(bookingId: string, bookings: Map<string, Seat[]>): void {
    if (!bookings.has(bookingId)) {
        throw new BookingError(`Booking ID ${bookingId} not found.`, { bookingId });
    }
}

export function validateSeatAvailability(seatPosition: string, seatingGrid: Array<Booking[]>
): void {
    let [rowIndex, colIndex] = convertSeatCode(seatPosition, seatingGrid.length);

    if (seatingGrid[rowIndex][colIndex].status !== SeatStatus.Available) {
        throw new BookingError(`Seat ${seatPosition} is not available.`, { seatPosition, rowIndex, colIndex, status: seatingGrid[rowIndex][colIndex].status });
    };
}
