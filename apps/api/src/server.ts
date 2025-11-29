import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import watchlistRoutes from './routes/watchlist';
import searchRoutes from './routes/search';
import familyRoutes from './routes/family';
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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/watchlist', watchlistRoutes);
app.use('/search', searchRoutes);
app.use('/family', familyRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;