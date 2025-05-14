import { z } from 'zod';

export const movieTitleSchema = z.string()
    .min(1, "Movie title cannot be empty")
    .max(50, "Movie title is too long");

export const rowsSchema = z.union([z.string(),z.number()])
    .refine(val => !isNaN(Number(val)), "Rows must be a number") 
    .refine(val => Number(val) > 0, "Rows must be positive")
    .refine(val => Number(val) <= 26, "Maximum 26 rows of seats allowed")
    .transform(val => Number(val));

export const seatsPerRowSchema = z.union([z.string(), z.number()])
    .refine(val => !isNaN(Number(val)), "Seats per row must be a number")
    .refine(val => Number(val) > 0, "Seats per row must be positive")
    .refine(val => Number(val) <= 50, "Maximum 50 seats per row allowed")
    .transform(val => Number(val));

export const movieSchema = z.string()
    .refine(input => input.split(' ').length === 3, {
        message: "Input must contain exactly 3 parts: [Title] [Row] [SeatsPerRow]"
    })
    .transform(input => {
        const [title, rows, seats] = input.split(' ');
        return { title, rows, seats };
    })
    .pipe(
        z.object({
            title: movieTitleSchema,
            rows: rowsSchema,
            seats: seatsPerRowSchema
        })
    );
export type MovieInput = z.infer<typeof movieSchema>;