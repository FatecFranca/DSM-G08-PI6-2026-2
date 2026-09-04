import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 SERVIDOR REST BACK-END INICIADO COM SUCESSO!`);
  console.log(`📡 URL Base: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`📋 Rotas Ativas:`);
  console.log(`   - Auth:         POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   - Serviços:     GET  http://localhost:${PORT}/api/services`);
  console.log(`   - Agendamentos: GET  http://localhost:${PORT}/api/appointments/available-slots`);
  console.log(`   - Avaliações:   POST http://localhost:${PORT}/api/reviews`);
  console.log(`   - IA (NLP):     POST http://localhost:${PORT}/api/ai/sentiment-analysis`);
  console.log('================================================================');
});
