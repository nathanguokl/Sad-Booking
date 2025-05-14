import { SeatStatus } from "../../types/ticketmaster.types";
import { convertSeatCode } from "../../utils/seat.util";
import TicketMasterService from "../ticketmaster.service";

describe('TicketMasterService', ()=> {
    let service: TicketMasterService;
    let consoleSpy: jest.SpyInstance;

    beforeEach(()=> {
        jest.clearAllMocks();
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(()=>{});
        service = new TicketMasterService(10, 8);
    })

    afterEach(()=>{
        consoleSpy.mockRestore();
    })

    describe('construtor', ()=> {
        it('Should initialise with correct dimensions', ()=> {
            const rows = service.seatingMap.length;
            const columns = service.seatingMap[0].length;
            expect(rows).toBe(10);
            expect(columns).toBe(8);
        });

        it('Booking counter should be empty', ()=> {
            const bookingCounter = Reflect.get(service, 'bookingCounter');
            expect(bookingCounter).toBe(0);
        })

        it('Should initialise with empty bookings', ()=> {
            const bookings = Reflect.get(service, 'bookings');
            expect(bookings.size).toBe(0);
        })

        it('Should validate number of seats', ()=> {
            expect(()=> new TicketMasterService(0, 8)).toThrow('Rows must be positive');
            expect(()=> new TicketMasterService(27, 8)).toThrow('Maximum 26 rows of seats allowed');
        })

        it('Should validate number of seats per row', ()=> {
            expect(()=> new TicketMasterService(10, 0)).toThrow('Seats per row must be positive');
            expect(()=> new TicketMasterService(10, 51)).toThrow('Maximum 50 seats per row allowed');
        })
    });

    describe('reserveSeats', ()=> {
        beforeEach(()=> {
            service.reservesSeat(1, "A01");
        })
        it('should reserve a seat', ()=> {
            const [rowIndex, colIndex] = convertSeatCode("A01", service.seatingMap.length);
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Reserved);
        })
        it('should throw error if seat is not in the right format', ()=> {
            expect(()=> service.reservesSeat(1, "DDAS9")).toThrow('Invalid seat code format');
        })
        it('should increment booking counter', ()=> {
            const bookingCounter = Reflect.get(service, 'bookingCounter');
            expect(bookingCounter).toBe(1);
        })
        it('should add booking to bookings map', () => {
            const bookings = Reflect.get(service, 'bookings');
            expect(bookings.size).toBe(1);
        })
        it('Booking ID should be generated correctly', ()=> {
            const bookings = Reflect.get(service, 'bookings');
            const [rowIndex, colIndex] = convertSeatCode("A01", service.seatingMap.length);
            expect(bookings.get("GIC0001")).toEqual([{row: rowIndex, column: colIndex}]);
        })
        it('should throw error if overbooking', ()=> {
            expect(()=>service.reservesSeat(81)).toThrow('Sorry, there are only 79 available')
        })

        it('Should be able to cancel a booking', ()=> {
            const [rowIndex, colIndex] = convertSeatCode("A01", service.seatingMap.length);
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Reserved);
            service.cancelReservation("GIC0001");
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Available);
        })

        it('Should be able to reserve seats at the back when there are no seats available at the front', ()=> {
            service.reservesSeat(40, "H01");
            const [rowIndex, colIndex] = convertSeatCode("A01", service.seatingMap.length);
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Reserved);
        });

        it('Should not be able to reserve 0 seats', ()=> {
            expect(()=>service.reservesSeat(0)).toThrow("Sorry, there are only 79 available")
        })
        
        it('Should not be able to cancel a booking that does not exist', ()=> {
            expect(()=>service.cancelReservation("GIC0002")).toThrow("Booking ID GIC0002 not found.")
        })

        it('Should start reserving from specified seat when provided', () => {
            service.reservesSeat(1, "H01"); // Reserve from row H
            const [rowIndex, colIndex] = convertSeatCode("H01", service.seatingMap.length);
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Reserved);
        });

        it('Should start reserving from last row when no seat specified', () => {
            service.reservesSeat(1);
            const lastRowIndex = service.seatingMap.length - 1;
            expect(service.seatingMap[lastRowIndex][0].status).toBe(SeatStatus.Reserved);
        });
    
    })

    describe('confirmBooking', ()=> {
        beforeEach(()=> {
            service.reservesSeat(1, "A01");
        })
        it('Should confirm a booking', ()=> {
            const [rowIndex, colIndex] = convertSeatCode("A01", service.seatingMap.length);
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Reserved);
            service.confirmBooking("GIC0001");
            expect(service.seatingMap[rowIndex][colIndex].status).toBe(SeatStatus.Booked);
        })

        it('Should throw error if booking does not exist', ()=> {
            expect(()=>service.confirmBooking("GIC0020")).toThrow("Booking ID GIC0020 not found.")
        })
    })

    describe('CheckBooking', ()=> {
        beforeEach(()=> {
            service.reservesSeat(1, "A01");
        })
        it('Should display booking details when valid booking ID is provided', ()=> {
            service.checkBooking("GIC0001");
            expect(consoleSpy).toHaveBeenCalledWith("Booking ID: GIC0001");
            expect(consoleSpy).toHaveBeenCalledWith("Selected seats:");
        })

        it('Should throw error if booking does not exist', ()=> {
            expect(()=>service.checkBooking("GIC0020")).toThrow("Booking ID GIC0020 not found.")
        })
    })

})