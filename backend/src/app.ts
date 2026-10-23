import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import servicesRoutes from './routes/services.routes';
import scheduleRoutes from './routes/schedule.routes';
import appointmentsRoutes from './routes/appointments.routes';
import reviewsRoutes from './routes/reviews.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middlewares/error.middleware';
import { pool } from './database/db';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const app: Application = express();

// Middlewares globais
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openApiDocument = JSON.parse(readFileSync(resolve(__dirname, '../../docs/openapi.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      status: 'online',
      database: 'connected',
      projeto: 'Sistema de Agendamento de Serviços Multiplataforma',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[HEALTH] PostgreSQL indisponível:', error);
    return res.status(503).json({ status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

// Registro de rotas da API REST (RNF08)
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/ai', aiRoutes);

// Middleware de tratamento global de erros
app.use(errorHandler);
