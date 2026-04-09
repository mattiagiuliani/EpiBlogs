import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

mongoose.connect(process.env.MONGODB_CONNECTION_URI?.trim() || "mongodb://127.0.0.1:27017/mydb")
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
