import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import logger from './utils/logger.js';
import { validateEnv } from './utils/validateEnv.js';

validateEnv(logger);

const PORT = Number(process.env.PORT) || 3000;
let server;

const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutdown signal received');

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        }

        await mongoose.connection.close();
        logger.info('HTTP server and database connection closed');
        process.exit(0);
    } catch (error) {
        logger.error({ err: error }, 'Graceful shutdown failed');
        process.exit(1);
    }
};

mongoose
    .connect(process.env.MONGODB_CONNECTION_URI.trim())
    .then(() => {
        logger.info('Database connected');
        server = app.listen(PORT, () => {
            logger.info({ port: PORT }, 'Server is running');
        });
    })
    .catch((err) => {
        logger.error({ err }, 'Database connection failed');
        process.exit(1);
    });

['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        shutdown(signal);
    });
});
