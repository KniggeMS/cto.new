import express, { Express } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { watchlistRouter } from './routes/watchlist';
import { searchRouter } from './routes/search';
import { familyRouter } from './routes/family';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/watchlist', watchlistRouter);
app.use('/search', searchRouter);
app.use('/family', familyRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;