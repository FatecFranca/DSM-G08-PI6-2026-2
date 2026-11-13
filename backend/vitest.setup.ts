// Ambiente de testes: banco não é necessário (pool do pg é apenas construído,
// sem conexões reais). Segredo JWT fixo para gerar tokens nos testes.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste-com-no-minimo-32-caracteres!!';
process.env.CORS_ORIGIN = 'http://localhost:5173';
