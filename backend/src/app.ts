import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import servicesRoutes from './routes/services.routes';
import scheduleRoutes from './routes/schedule.routes';
import appointmentsRoutes from './routes/appointments.routes';
import reviewsRoutes from './routes/reviews.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middlewares/error.middleware';

export const app: Application = express();

// Middlewares globais
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check e status da API
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    projeto: 'Sistema de Agendamento de Serviços Multiplataforma',
    sprint: '1ª Sprint - 04/09/2026',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
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
