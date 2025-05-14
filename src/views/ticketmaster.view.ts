import { Booking } from "../types/ticketmaster.types";

export const renderSeatingMap = (
  board: Array<Booking[]>
): void => {
  const terminalWidth = process.stdout.columns || 80;
  const rows = board.length;
  const columns = board[0].length;
  const seatWidth = 3;
  const rowLabelWidth = 2;
  const totalRowWidth = (columns * seatWidth) + rowLabelWidth;

  const leftPadding = Math.max(Math.floor((terminalWidth - totalRowWidth) / 2), 0);
  const pad = ' '.repeat(leftPadding);

  const screenLabel = '🎥 S C R E E N';
  const screenPadding = Math.floor((terminalWidth - screenLabel.length) / 2);
  console.log(' '.repeat(screenPadding) + screenLabel);

  console.log(pad + '-'.repeat(totalRowWidth + 1));

  for (let i = 0; i < rows; i++) {
    const rowLabel = String.fromCharCode(65 + rows - i - 1);

    const rowSeats = board[i]
      .map(seat => seat.status)
      .map(status => status.padStart(seatWidth, ' '))
      .join('');

    console.log(pad + `${rowLabel} ${rowSeats}`);
  }

  const columnNumbers = Array.from({ length: columns }, (_, index) =>
    (index + 1).toString().padStart(seatWidth, ' ')
  );

  console.log(pad + ' '.repeat(rowLabelWidth) + columnNumbers.join(''));
};
