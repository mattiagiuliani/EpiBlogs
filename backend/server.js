import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import authorRouter from './routes/authorRouter.js';

const PORT = process.env.PORT 

const server = express(); 
server.use(cors()); 
server.use(express.json()); 

server.use(authorRouter);

await mongoose  
.then(() => console.log('Database connected!'))
.catch((err) => console.log(err)); 

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 