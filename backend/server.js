import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import labRoutes from './routes/labRoutes.js';
import manufacturerRoutes from './routes/manufacturerRoutes.js';
import traceabilityRoutes from './routes/traceabilityRoutes.js';
import blockchainRoutes from './routes/blockchainRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Robust CORS setup: allow multiple dev origins and handle preflight
const envOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const defaultDevOrigins = [
  'http://localhost:19006', // Expo web
  'http://localhost:19000', // Expo dev
  'http://localhost:3000',
  'http://localhost:3001',
];
const allowedOrigins = Array.from(new Set([...defaultDevOrigins, ...envOrigins]));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow mobile/CLI tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/farmer', farmerRoutes);
app.use('/lab', labRoutes);
app.use('/manufacturer', manufacturerRoutes);
app.use('/traceability', traceabilityRoutes);
app.use('/blockchain', blockchainRoutes);
app.use('/requests', requestRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`AyurTrack API running on :${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
