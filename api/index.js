import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors'
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../lib/swagger.js";

// Database
import connectToDB from '../lib/db.js';

// Routes
import authRoutes from '../routes/auth.routes.js';
import usersRoutes from '../routes/users.routes.js';
import quizRoutes from '../routes/quiz.routes.js';
import roadmapRoutes from '../routes/roadmap.routes.js';
import { checkApiKey } from '../middleware/middlewares.js';

// Error handlers
import { globalErrorHandler, notFoundHandler } from '../lib/errorHandlers.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000

app.use(cors({ origin: true, credentials: true }))
app.use(helmet());

// Rate limiting: limit repeated requests to API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// Parse JSON requests
app.use(express.json());

// Parse cookies
app.use(cookieParser());
//add api documentation using swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Check API key middleware
app.use(checkApiKey);

//routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/roadmap', roadmapRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

//error handlers 
notFoundHandler(app);
globalErrorHandler(app);

//database connection 
connectToDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
