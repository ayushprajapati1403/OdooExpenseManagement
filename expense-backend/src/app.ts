import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';

const app = express();

// Middleware
app.use(cors());

// JSON parsing middleware - exclude file upload routes
app.use((req, res, next) => {
  // Skip JSON parsing for file upload routes
  if (req.path.includes('/ocr/') && req.method === 'POST') {
    return next();
  }
  express.json()(req, res, next);
});

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
