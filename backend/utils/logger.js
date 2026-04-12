import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL?.trim() || 'info'
});

export default logger;
