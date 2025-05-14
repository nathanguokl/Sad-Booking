export enum SeatStatus {
    Available = '.',
    Booked = '#',
    Reserved = 'o'
}

export type Booking = {
    status: SeatStatus;
    bookingId: string | null;
}

export type Seat = {
    row: number;
    column: number;
}