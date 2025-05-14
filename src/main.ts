import * as readline from 'readline';
import TicketMasterController from './controllers/ticketmaster.controller';
import TicketMasterService from './services/ticketmaster.service';
import { movieSchema } from './validators/movie.validator';
import { handleError } from './errors/general.error';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})



const main = () => {
    console.log('Welcome to the movie theater!')
    rl.question('Please define move title and seating map in [Title] [Row] [SeatsPerRow] format:\n', (input: string)=> {
        try {
            const {title, rows, seats} = movieSchema.parse(input.trim());
            const ticketService = new TicketMasterService(rows, seats);
            const ticketController = new TicketMasterController(title, rl, ticketService);
            ticketController.displayMainMenu();
        } catch (error) {
            handleError(error);
            main();
        }
     })
}

main();