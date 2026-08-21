import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import shopRoutes from './routes/shop.routes.js';
import barberRoutes from './routes/barber.routes.js';
import serviceRoutes from './routes/service.routes.js';
import adminRoutes from './routes/admin.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import barberQueueRoutes from './routes/barberQueue.routes.js';
import reviewRoutes from './routes/review.routes.js';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/barber', barberQueueRoutes);
app.use('/api', barberRoutes);
app.use('/api', serviceRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler (including Multer and file validation errors)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit. Please upload a smaller file.' });
    }
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('JPG, PNG and PDF'))) {
    return res.status(400).json({ message: 'Error: Invalid file type. Only JPG, PNG and PDF are allowed.' });
  }
  return res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
});

export default app;
