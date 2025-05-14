import * as readline from 'readline';
import { getAvailableSeatsCount } from '../utils/seat.util';
import { renderSeatingMap } from '../views/ticketmaster.view';
import TicketMasterService from '../services/ticketmaster.service';
import { bookingIdSchema, bookingInputSchema, seatPositionSchema } from '../validators/booking.validator';
import { handleError } from '../errors/general.error';

class TicketMasterController {
    private title: string;
    private rl: readline.Interface;
    private service: TicketMasterService;

    constructor(_title: string, _rl: readline.Interface, service: TicketMasterService) {
        this.title = _title;
        this.rl = _rl;
        this.service = service;
    }

    displaySeatingMap(): void {
        console.log(renderSeatingMap(this.service.seatingMap));
    }

    startBookingProcess(): void {
        this.rl.question('Enter the number of tickets and starting seat\n', (input: string) => {
            try {
                const { numTickets, seatPosition } = bookingInputSchema.parse(input.trim());
                const bookingID = this.service.reservesSeat(numTickets, seatPosition);
    
                this.promptSeatPreference(numTickets, bookingID!);
            } catch (error) {
                handleError(error);
                this.startBookingProcess();
            }
        });
    }
    
    promptSeatPreference(numTickets: number, bookingID: string): void {
        this.rl.question('Enter blank to accept seat selection, or enter new seating position:\n', (input: string) => {
            if (input === '') {
                this.service.confirmBooking(bookingID);
                return this.displayMainMenu();
            }
    
            try {
                const validatedSeatPosition = seatPositionSchema.parse(input.trim());
                this.service.cancelReservation(bookingID);
                this.service.reservesSeat(numTickets, validatedSeatPosition);
                this.promptSeatPreference(numTickets, bookingID);
            } catch (error) {
                handleError(error);
                this.promptSeatPreference(numTickets, bookingID);
            }
        });
    }

    checkBookingStatus(): void {
        this.rl.question('Enter booking id, or enter blank to go back to main menu:\n', (input: string) => {
            try {
                if (input.trim() === '') {
                    this.displayMainMenu();
                    return;
                }
                const validatedBookingId = bookingIdSchema.parse(input.trim())
                const bookingID = validatedBookingId;
                this.service.checkBooking(bookingID);
                this.checkBookingStatus();
            } catch (error) {
                handleError(error);
                this.displayMainMenu();
            }
        })
    }

    displayMainMenu(): void {
        const seatsAvailable = getAvailableSeatsCount(this.service.seatingMap);
        console.log(`\nWelcome to GIC Cinemas 🎦`)
        console.log(`[1] Book tickets for ${this.title} (${seatsAvailable} seats available)`);
        console.log('[2] Check bookings');
        console.log('[3] Exit')
        this.rl.question('Please enter your selection:\n', (input: string) => {
            switch (input) {
                case '1':
                    this.startBookingProcess();
                    break;
                case '2':
                    this.checkBookingStatus();
                    break;
                case '3':
                    console.log('Thanks for giving me this opportunity to present my work! - Nathan Guo')
                    this.rl.close();
                    break;
                default:
                    console.log('Invalid selection. Please try again.')
                    this.displayMainMenu();
            }
        })
    }

}

export default TicketMasterController;