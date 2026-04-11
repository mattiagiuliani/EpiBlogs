import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import logger from './utils/logger.js';
import { validateEnv } from './utils/validateEnv.js';

validateEnv(logger);

const PORT = Number(process.env.PORT) || 3000;

mongoose
    .connect(process.env.MONGODB_CONNECTION_URI.trim())
    .then(() => {
        logger.info('Database connected');
        app.listen(PORT, () => {
            logger.info({ port: PORT }, 'Server is running');
        });
    })
    .catch((err) => {
        logger.error({ err }, 'Database connection failed');
        process.exit(1);
    });
