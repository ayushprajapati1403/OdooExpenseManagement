import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Expense Management API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(config.nodeEnv === 'development' && { details: err.message })
  });
});

export default app;
