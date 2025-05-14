import winston from "winston";

const logConfiguration = {
    transports: [
        new winston.transports.Console({
            // Disable logging in test environment
            silent: process.env.NODE_ENV === 'test', 
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ level, message, metadata }) => {
                    return `${level}: ${message} ${metadata ? JSON.stringify(metadata) : ''}`;
                })
            ),
        }),
        new winston.transports.File({
            filename: 'logs/ticketmaster.log',
            // Disable logging in test environment
            silent: process.env.NODE_ENV === 'test',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
}

export const logger = winston.createLogger(logConfiguration);