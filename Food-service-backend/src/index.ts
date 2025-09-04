import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { testConnection } from './db';
import { ServerConfig } from './config';
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import adminRoutes from './routes/admin';
import bookingRoutes from './routes/bookings';

const app: Express = express();
const port = ServerConfig.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Food Service API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: ServerConfig.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(port, '0.0.0.0', async () => {
  console.log(`⚡️[server]: Food Service API is running at http://0.0.0.0:${port}`);
  console.log(`🌐 Access from network: http://10.99.20.245:${port}`);
  
  // Test database connection
  await testConnection();
});

export default app;
