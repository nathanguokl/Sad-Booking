import { convertSeatCode, createEmptySeatingLayout, getAvailableSeatsCount, getSeatPriority, getSeatsInColumnRange } from '../utils/seat.util';
import { SeatStatus, Booking, Seat } from '../types/ticketmaster.types';
import { validateBookingId } from '../middlewares/booking.middleware';
import { logger } from '../utils/logger.util';
import { renderSeatingMap } from '../views/ticketmaster.view';
import { rowsSchema, seatsPerRowSchema } from '../validators/movie.validator';

class TicketMasterService {
    private seatingGrid: Array<Booking[]>;
    private bookings: Map<string, Seat[]>;
    private bookingCounter: number;

    constructor(_rows: number, _columns: number) {
        const validatedRows = rowsSchema.parse(_rows);
        const validatedColumns = seatsPerRowSchema.parse(_columns);
        this.seatingGrid = createEmptySeatingLayout(validatedRows, validatedColumns);
        this.bookings = new Map();
        this.bookingCounter = 0;
    }

    private generateBookingId(): string {
        this.bookingCounter++;
        return `GIC${this.bookingCounter.toString().padStart(4, '0')}`;
    }

    get seatingMap(): Array<Booking[]> {
        return this.seatingGrid;
    }

    reservesSeat(numTickets: number, seatPosition?: string | null): string | undefined{
        try {
            const availableSeats = getAvailableSeatsCount(this.seatingGrid)
            if (numTickets <= 0 || numTickets > availableSeats) {
                throw new Error(`Sorry, there are only ${availableSeats} available.`)
            }
            let seat = null;
            if (seatPosition != null) {
                // Seems like we will just check next available instead
                //validateSeatAvailability(seatPosition, this.seatingGrid);
                seat = convertSeatCode(seatPosition, this.seatingGrid.length);
            }
            const rowsLength = this.seatingGrid.length;
            const colsLength = this.seatingGrid[0].length;

            const baseOrder = getSeatPriority(colsLength);
            let startRow = seat != null ? seat[0] : this.seatingGrid.length - 1;
            let startCol = seat != null ? seat[1] : 1;
            
            const orderForRow = (rowIndex: number) => {
                return seat && rowIndex === startRow
                    ? getSeatsInColumnRange(startCol, colsLength)
                    : baseOrder;
            }
            const reservedSeats: Seat[] = [];
            let remainingTickets = numTickets;
            // 1st pass to book seats from the assigned position
            for (let r = startRow; r >= 0 && remainingTickets > 0; r--) {
                for (const c of orderForRow(r)) {
                    if (this.seatingGrid[r][c].status === SeatStatus.Available) {
                        this.seatingGrid[r][c].status = SeatStatus.Reserved;
                        reservedSeats.push({ row: r, column: c });
                        if (--remainingTickets === 0) {
                            break;
                        }
                    }
                }
            }

            // 2nd pass to book seats from the last row
            if (remainingTickets > 0) {
                for (let r = rowsLength - 1; r >= 0 && remainingTickets > 0; r--) {
                    for (const c of baseOrder) {
                        if (this.seatingGrid[r][c].status === SeatStatus.Available) {
                            this.seatingGrid[r][c].status = SeatStatus.Reserved;
                            reservedSeats.push({ row: r, column: c });
                            if (--remainingTickets === 0) {
                                break;
                            }
                        }
                    }
                }
            }
            
            const bookingId = this.generateBookingId();
            this.bookings.set(bookingId, reservedSeats);
            renderSeatingMap(this.seatingGrid);
            logger.info(`Successfully reserved ${numTickets} seats`, { bookingId, seats: reservedSeats});
            return bookingId;
        } catch (error) {
            throw error;
        }
    }

    cancelReservation(bookingId: string): void {
        try {
            validateBookingId(bookingId, this.bookings);
            const reservedSeats = this.bookings.get(bookingId);
            for (const seat of reservedSeats!) {
                this.seatingGrid[seat.row][seat.column].status = SeatStatus.Available;
                this.seatingGrid[seat.row][seat.column].bookingId = null;
            }
            this.bookings.delete(bookingId);
            this.bookingCounter--;
            logger.info(`Successfully canelled booking reservation: ${bookingId}`);
        } catch (error) {
            let err = error as Error;
            logger.error(`Reservation cancellation failed: ${err.message}`, { bookingId });
            throw error;
        }
    }

    confirmBooking(bookingId: string): void {
        try {
            validateBookingId(bookingId, this.bookings);
            const reservedSeats = this.bookings.get(bookingId);
            for (const seat of reservedSeats!) {
                this.seatingGrid[seat.row][seat.column].status = SeatStatus.Booked;
                this.seatingGrid[seat.row][seat.column].bookingId = bookingId;
            }
            logger.info(`Booking ${bookingId} confirmed.`);
        } catch (error) {
            let err = error as Error;
            logger.error(`Booking confirmation failed: ${err.message}`, { bookingId });
            throw error;
        }
    }

    checkBooking(bookingId: string): void {
        try {
            validateBookingId(bookingId, this.bookings);
            const seats = this.bookings.get(bookingId);
            const newGrid = this.seatingGrid.map(row => row.map(seat => ({ ...seat })));
            for (const seat of seats!) {
                newGrid[seat.row][seat.column].status = SeatStatus.Reserved;
            }
            console.log(`Booking ID: ${bookingId}`);
            console.log('Selected seats:');
            renderSeatingMap(newGrid);
        } catch (error) {
            let err = error as Error;
            logger.error(`Error in finding booking ID: ${err.message}`, { bookingId});
            throw error;
        }
    }
}

export default TicketMasterService;