import { Booking, SeatStatus } from "../types/ticketmaster.types";

export function convertSeatCode(seatCode: string, totalRows: number): [number, number] {
    const match = seatCode.match(/^([a-zA-Z])(\d{1,2})$/);
    if (!match) {
        throw new Error(`Invalid seat code format: ${seatCode}`);
    }
    const rowLetter = match[1].toUpperCase();
    const columnNumber = parseInt(match[2], 10);
    const rowIndex = totalRows - (rowLetter.charCodeAt(0) - 'A'.charCodeAt(0)) - 1;
    const columnIndex = columnNumber - 1;
    if (rowIndex < 0 || rowIndex >= totalRows || columnIndex < 0 || columnIndex >= totalRows) {
        throw new Error(`Seat code ${seatCode} is out of bounds.`);
    }
    return [rowIndex, columnIndex];
}

export function getSeatPriority(colsLength: number): number[] {
    const center = Math.floor(colsLength / 2);
    const order: number[] = [center];
    for(let offset = 1; order.length < colsLength; offset++) {
        if (center-offset >= 0) order.push(center-offset);
        if (center+offset < colsLength) order.push(center+offset);
    }
    return order;
}

export function getSeatsInColumnRange(startCol: number, endCol: number): number[] {
    return Array.from({ length: endCol - startCol }, (_, k) => startCol + k);
}

export function createEmptySeatingLayout(rows: number, columns: number): Array<Booking[]> {
    return Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => ({
            status: SeatStatus.Available,
            bookingId: null,
        }))
    );
}

export function getAvailableSeatsCount(seatingGrid: Array<Booking[]>): number {
    return seatingGrid.flat().filter(seat => seat.status === SeatStatus.Available).length;
}