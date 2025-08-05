import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import itemRoutes from './routes/items.js';
import bookingRoutes from './routes/bookings.js';
import categoryRoutes from './routes/categories.js';

// Import middleware
import {
  helmetConfig,
  compressionMiddleware,
  loggingMiddleware,
  apiLoggingMiddleware,
  errorHandler,
  corsOptions,
  generalRateLimit,
  apiRateLimit,
  authRateLimit,
  maintenanceMode,
  requestTimeout,
  validateContentType,
} from './middleware/security.js';

// Load environment variables
// dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmetConfig);
app.use(compressionMiddleware);
app.use(maintenanceMode);
app.use(requestTimeout());

// CORS
app.use(cors(corsOptions));

// Logging
app.use(loggingMiddleware);
app.use(apiLoggingMiddleware);

// Rate limiting
app.use(generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Content type validation for API routes
app.use('/api', validateContentType(['application/json', 'multipart/form-data']));

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'P2P Backend API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// API routes with specific rate limits
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/users', apiRateLimit, userRoutes);
app.use('/api/items', apiRateLimit, itemRoutes);
app.use('/api/bookings', apiRateLimit, bookingRoutes);
app.use('/api/categories', apiRateLimit, categoryRoutes);

// 404 handler - must be after all routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware - must be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 P2P Backend Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API Base URL: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default app;
