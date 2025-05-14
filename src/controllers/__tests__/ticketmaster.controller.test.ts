import * as readline from "readline";
import TicketMasterController from '../ticketmaster.controller';
import TicketMasterService from '../../services/ticketmaster.service';
import { bookingIdSchema, bookingInputSchema, seatPositionSchema } from '../../validators/booking.validator';
import { handleError } from '../../errors/general.error';
import * as SeatUtil from '../../utils/seat.util';
import { renderSeatingMap } from "../../views/ticketmaster.view";


jest.mock('../../services/ticketmaster.service');
jest.mock('../../validators/booking.validator');
jest.mock('../../errors/general.error');
jest.mock('../../views/ticketmaster.view', () => ({
  renderSeatingMap: jest.fn()
}));


describe('TicketMasterController with mock-stdin', () => {
  let controller: TicketMasterController;
  let service: jest.Mocked<TicketMasterService>;
  let mockRL: jest.Mocked<readline.Interface>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRL = {
      question: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<readline.Interface>;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    service = new TicketMasterService(8, 10) as jest.Mocked<TicketMasterService>;
    controller = new TicketMasterController('Movie Title', mockRL, service);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockRL.close();
    consoleSpy.mockRestore();
  });

  describe('display seating map', () => {
    it('should display the seating map', () => {
      const testSeats = SeatUtil.createEmptySeatingLayout(8, 10);
      Object.defineProperty(service, 'seatingMap', {
        get: jest.fn().mockReturnValue(testSeats)
      });
      (renderSeatingMap as jest.Mock).mockReturnValue('Rendered Seating Map');
      controller.displaySeatingMap();
      expect(renderSeatingMap).toHaveBeenCalledWith(testSeats);
      expect(consoleSpy).toHaveBeenCalledWith('Rendered Seating Map');

    })
  })

  describe('startBookingProcess', () => {
    it('should call reservesSeat and promptSeatPreference when input is valid', () => {
      const mockBookingID = 'GIC0001';
      const numTickets = 2;
      const seatPosition = 'A01';
      const input = `${numTickets} ${seatPosition}`;

      (bookingInputSchema.parse as jest.Mock).mockReturnValue({
        numTickets,
        seatPosition,
      });

      service.reservesSeat.mockReturnValue(mockBookingID);

      const promptSeatPreferenceSpy = jest.spyOn(controller, 'promptSeatPreference');

      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback) => {
        if (callCount++ < 1) {
          callback(input);
        }
      });

      controller.startBookingProcess();

      expect(service.reservesSeat).toHaveBeenCalledWith(numTickets, seatPosition);
      expect(promptSeatPreferenceSpy).toHaveBeenCalledWith(numTickets, mockBookingID);
      expect(promptSeatPreferenceSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid ticket count', () => {
      const numTickets = -1;
      const seatPosition = 'A01';
      const input = `${numTickets} ${seatPosition}`;

      (bookingInputSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Number of tickets must be greater than 0')
      })

      const handleErrorSpy = jest.spyOn({ handleError }, 'handleError');
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback) => {
        if (callCount++ < 1) {
          callback(input);
        }
      })
      controller.startBookingProcess();
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error('Number of tickets must be greater than 0'));
      expect(service.reservesSeat).not.toHaveBeenCalled();
    });

    it('should handle invalid seat position', () => {
      const numTickets = 2;
      const seatPosition = 'invalid';
      const input = `${numTickets} ${seatPosition}`;
      (bookingInputSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Seat position must be in format: [Row Letter][Seat Number] (e.g A1, B2)');
      })
      const handleErrorSpy = jest.spyOn({ handleError }, 'handleError');
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback) => {
        if (callCount++ < 1) {
          callback(input);
        }
      })
      controller.startBookingProcess();
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error('Seat position must be in format: [Row Letter][Seat Number] (e.g A1, B2)'));
      expect(service.reservesSeat).not.toHaveBeenCalled();
    })

  })

  describe('Prompt for seat preferences', () => {

    it('Should accept the seat selection if blank is entered', () => {
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback) => {
        if (callCount++ < 1) {
          callback("")
        }
      })
      const confirmBookingSpy = jest.spyOn(service, 'confirmBooking').mockImplementation(() => { });
      const displayMainMenuSpy = jest.spyOn(controller, 'displayMainMenu').mockImplementation(() => { });
      controller.promptSeatPreference(1, "GIC0001");
      expect(confirmBookingSpy).toHaveBeenCalled();
      expect(displayMainMenuSpy).toHaveBeenCalled();
    });

    it('Should accept the seat selection if blank is entered', () => {
      let errorMessage = "Seat position must be in format: [Row Letter][Seat Number] (e.g A1, B2)";
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback) => {
        if (callCount++ < 1) {
          callback("Invalid Input")
        }
      });
      (seatPositionSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage)
      })
      const handleErrorSpy = jest.spyOn({ handleError }, 'handleError');
      const promptSeatPreferenceSpy = jest.spyOn(controller, 'promptSeatPreference');
      controller.promptSeatPreference(1, "GIC0001");
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error(errorMessage));
      expect(promptSeatPreferenceSpy).toHaveBeenCalledTimes(2);
    });

    it('Should call cancel and reserveSeat if valid seat position is given', ()=> {
      let seat = "A01";
      const cancelReservationSpy = jest.spyOn(service, 'cancelReservation').mockImplementation(()=>{});
      const reservesSeatSpy = jest.spyOn(service, 'reservesSeat').mockImplementation(()=>"reserved");
      const promptSeatPreferenceSpy = jest.spyOn(controller, 'promptSeatPreference');
      let callCount = 0; 
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount++ < 1) {
          callback(seat);
        }
      });
      (seatPositionSchema.parse as jest.Mock).mockImplementation(()=>{
        return seat
      });
      controller.promptSeatPreference(5, "GIC0001");
      expect(cancelReservationSpy).toHaveBeenCalled()
      expect(reservesSeatSpy).toHaveBeenCalled()
      expect(promptSeatPreferenceSpy).toHaveBeenCalledTimes(2);
    })
  })

  describe('Check booking status', ()=> {
    it('Should throw error if booking id is not valid', ()=>{
      let callCount = 0;
      let errorMessage = "Booking ID must contain only uppercase letters and numbers";
      (bookingInputSchema.parse as jest.Mock).mockImplementation(()=> {
        throw new Error(errorMessage);
      });
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=>{
        if (callCount++ < 1) {
          callback("invalid-0001");
        }
      })
      controller.startBookingProcess();
      const handleErrorSpy = jest.spyOn({handleError}, 'handleError');
      const checkBookingSpy = jest.spyOn(service, 'checkBooking');
      expect(bookingInputSchema.parse).toHaveBeenCalledWith("invalid-0001");
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error(errorMessage));
      expect(checkBookingSpy).not.toHaveBeenCalled();
    });

    it('Should return to display main menu if blank is entered', ()=> {
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount++ < 1) {
          callback("");
        }
      })
      const displayMainMenuSpy = jest.spyOn(controller, 'displayMainMenu').mockImplementation(()=>{});
      const checkBookingSpy = jest.spyOn(service, 'checkBooking').mockImplementation(()=>{});
      controller.checkBookingStatus();
      expect(displayMainMenuSpy).toHaveBeenCalled();
      expect(checkBookingSpy).not.toHaveBeenCalled();
    })

    it('Should throw error if booking id is not found', ()=> {
      let bookingId = "GIC0001";
      let callCount = 0;
      (bookingIdSchema.parse as jest.Mock).mockImplementation(()=>{
        throw new Error("Booking ID must contain only uppercase letters and numbers");
      });
      const handleErrorSpy = jest.spyOn({handleError}, 'handleError');
      const checkBookingSpy = jest.spyOn(service, 'checkBooking');
      const displayMainMenuSpy = jest.spyOn(controller, 'displayMainMenu').mockImplementation(()=>{});
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
          if (callCount++ < 1) {
            callback(bookingId);
          }
      })
      controller.checkBookingStatus();
      expect(bookingIdSchema.parse).toHaveBeenCalledWith(bookingId);
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error("Booking ID must contain only uppercase letters and numbers"));
      expect(checkBookingSpy).not.toHaveBeenCalled();
    })

    it('Should call checkBooking if valid booking id is entered', ()=> {
      let bookingId = "GIC0001";
      let callCount = 0;
      (bookingIdSchema.parse as jest.Mock).mockImplementation(()=>{
        return bookingId;
      });
      const checkBookingSpy = jest.spyOn(service, 'checkBooking').mockImplementation(() => {});
      const checkBookingStatusSpy = jest.spyOn(controller, 'checkBookingStatus');
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount === 0) {
          callCount++;
          callback(bookingId);
        }
      });
      controller.checkBookingStatus();
      expect(bookingIdSchema.parse).toHaveBeenCalledWith(bookingId);
      expect(checkBookingSpy).toHaveBeenCalledWith(bookingId);
      expect(checkBookingStatusSpy).toHaveBeenCalledTimes(2);
    });
  })

  describe('Display main menu', ()=> {
    beforeEach(()=>{
      jest.spyOn(SeatUtil, 'getAvailableSeatsCount').mockReturnValue(10);
    });

    it('Should should display the main menu', ()=>{
      const displayMainMenuSpy = jest.spyOn(controller, 'displayMainMenu').mockImplementation(()=>{});
      controller.displayMainMenu();
      expect(displayMainMenuSpy).toHaveBeenCalled();
    })

    it('Should call startBookingProcess if 1 is entered', ()=> {
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount++ < 1) {
          callback("1");
        }
      });
      const startBookingProcessSpy = jest.spyOn(controller, 'startBookingProcess').mockImplementation(() => {});
      controller.displayMainMenu();
      expect(startBookingProcessSpy).toHaveBeenCalled();
    })

    it('Should call checkBookingStatus if 2 is entered', ()=> {
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount++ < 1) {
          callback("2");
        }
      });
      const checkBookingStatusSpy = jest.spyOn(controller, 'checkBookingStatus').mockImplementation(() => {});
      controller.displayMainMenu();
      expect(checkBookingStatusSpy).toHaveBeenCalled();
    })

    it('Should call close if 3 is entered', ()=> {
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount++ < 1) {
          callback("3");
        }
      });
      const closeSpy = jest.spyOn(mockRL, 'close').mockImplementation(() => {});
      controller.displayMainMenu();
      expect(closeSpy).toHaveBeenCalled();
    })

    it('Should call displayMainMenu if invalid input is entered', ()=> {
      let callCount = 0;
      (mockRL.question as jest.Mock).mockImplementation((_, callback)=> {
        if (callCount++ < 1) {
          callback("This is an invalid value");
        }
      });
      const displayMainMenuSpy = jest.spyOn(controller, 'displayMainMenu')
      controller.displayMainMenu();
      expect(displayMainMenuSpy).toHaveBeenCalledTimes(2)
    })
    
  })
  






});


