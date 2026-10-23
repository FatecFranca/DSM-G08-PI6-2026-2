import 'dotenv/config';
import { app } from './app';
import { pool } from './database/db';

const PORT = process.env.PORT || 3000;

async function start() {
  await pool.query('SELECT 1');
  const server = app.listen(PORT, () => {
  console.log('================================================================');
  console.log('API REST iniciada com PostgreSQL conectado.');
  console.log(`📡 URL Base: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`📘 OpenAPI/Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`📋 Rotas Ativas:`);
  console.log(`   - Auth:         POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   - Serviços:     GET  http://localhost:${PORT}/api/services`);
  console.log(`   - Agendamentos: GET  http://localhost:${PORT}/api/appointments/available-slots`);
  console.log(`   - Avaliações:   POST http://localhost:${PORT}/api/reviews`);
  console.log(`   - IA (NLP):     POST http://localhost:${PORT}/api/ai/sentiment-analysis`);
  console.log('================================================================');
  });

  const shutdown = () => server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(error => {
  console.error('Falha ao iniciar API/PostgreSQL:', error);
  process.exitCode = 1;
});
