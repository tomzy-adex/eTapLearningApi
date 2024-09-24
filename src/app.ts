import express from 'express';
import bodyParser from 'body-parser';
import subjectRoutes from './routes/subjectRoutes';
import topicRoutes from './routes/topicRoutes';
import studentRoutes from './routes/studentRoutes';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';


const app = express();
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
// Specify CORS options
const corsOptions = {
  origin: 'https://e-tap-learning.vercel.app', // Frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Enable if you want to include credentials like cookies
};

// Use CORS middleware with the defined options
app.use(cors(corsOptions));

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

// Define your routes
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/students', studentRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
