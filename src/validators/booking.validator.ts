import { z } from 'zod';

export const seatPositionSchema = z.string()
    .trim()
    .regex(/^[A-Z][0-9]+$/, "Seat position must be in format: [Row Letter][Seat Number] (e.g A1, B2)")
    .optional()

export const bookingInputSchema = z.string()
    .transform(input => {
        const parts = input.trim().split(' ');
        return {
            numTickets: Number(parts[0]),
            seatPosition: parts[1] ?? undefined
        }
    })
    .pipe(
        z.object({
            numTickets: z.number()
                .refine(val => !isNaN(val), "Number of tickets must be a number")
                .refine(val => val > 0, "Number of tickets must be greater than 0") 
                .transform(val => val),
            seatPosition: seatPositionSchema
        })
    );

export const bookingIdSchema = z.string()
    .min(1, "Booking ID cannot be empty")
    .regex(/^[A-Z0-9]+$/, "Booking ID must contain only uppercase letters and numbers")

export type SeatPosition = z.infer<typeof seatPositionSchema>;
export type BookingInput = z.infer<typeof bookingInputSchema>;
export type bookingId = z.infer<typeof bookingIdSchema>;