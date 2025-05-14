import { z } from "zod";
import { logger } from "../utils/logger.util";

export function handleError(error: unknown): void {
    if (error instanceof z.ZodError) {
        logger.error(error.errors.map(e => e.message).join('\n'));
    } else {
        logger.error((error as Error).message);
    }
}