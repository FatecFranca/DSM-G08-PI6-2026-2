-- Dados fictícios para desenvolvimento local. Não execute em produção.
-- Senha para os três perfis: Agendou2026!
INSERT INTO usuarios (id_usuario, nome, email, senha, telefone, tipo_perfil, nome_negocio, endereco)
VALUES
    (1, 'Carlos Barbearia VIP', 'prestador@exemplo.com', '$2a$10$fQBrTpS5aS1ZNx6u/ieO3.MLjIcemJA0ulPfbOBNMo.xlmnqq/rS.', '(11) 98765-4321', 'Prestador', 'Barbearia Vintage & Estilo', 'Av. Paulista, 1000 - Bela Vista, SP'),
    (2, 'Mariana Silva', 'cliente@exemplo.com', '$2a$10$fQBrTpS5aS1ZNx6u/ieO3.MLjIcemJA0ulPfbOBNMo.xlmnqq/rS.', '(11) 91234-5678', 'Cliente', NULL, NULL),
    (3, 'Admin Agendou', 'admin@agendou.com', '$2a$10$fQBrTpS5aS1ZNx6u/ieO3.MLjIcemJA0ulPfbOBNMo.xlmnqq/rS.', '(11) 90000-0000', 'Admin', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

SELECT setval(pg_get_serial_sequence('usuarios', 'id_usuario'), (SELECT MAX(id_usuario) FROM usuarios));

INSERT INTO servicos (id_prestador, titulo, descricao, duracao_minutos, preco)
SELECT 1, seed.titulo, seed.descricao, seed.duracao, seed.preco
FROM (VALUES
  ('Corte de Cabelo Degradê', 'Corte moderno com acabamento na navalha e lavagem especial.', 45, 50.00),
  ('Barba Terapia Completa', 'Toalha quente, alinhamento e hidratação com óleos essenciais.', 30, 40.00),
  ('Combo Cabelo + Barba', 'Tratamento completo com atendimento premium.', 60, 80.00)
) AS seed(titulo, descricao, duracao, preco)
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE id_prestador=1 AND servicos.titulo=seed.titulo);

INSERT INTO jornadas_trabalho
    (id_prestador, dia_semana, hora_inicio, hora_fim, inicio_intervalo, fim_intervalo)
VALUES
    (1, 1, '09:00', '18:00', '12:00', '13:00'),
    (1, 2, '09:00', '18:00', '12:00', '13:00'),
    (1, 3, '09:00', '18:00', '12:00', '13:00'),
    (1, 4, '09:00', '18:00', '12:00', '13:00'),
    (1, 5, '09:00', '19:00', '12:00', '13:00')
ON CONFLICT (id_prestador, dia_semana) DO NOTHING;

INSERT INTO agendamentos
    (id_cliente, id_prestador, id_servico, data_hora_inicio, data_hora_fim, status, observacoes)
SELECT
    2, 1, 2,
    ((CURRENT_DATE - 1) + TIME '14:00') AT TIME ZONE 'America/Sao_Paulo',
    ((CURRENT_DATE - 1) + TIME '14:30') AT TIME ZONE 'America/Sao_Paulo',
    'Concluído',
    'Atendimento fictício de demonstração'
WHERE NOT EXISTS (
    SELECT 1 FROM agendamentos
    WHERE id_cliente=2 AND id_prestador=1 AND id_servico=2
      AND observacoes='Atendimento fictício de demonstração'
);

INSERT INTO avaliacoes (id_agendamento, nota, comentario, sentimento_predito)
SELECT id_agendamento, 5, 'Atendimento pontual e excelente.', 'Positivo'
FROM agendamentos
WHERE id_cliente=2 AND id_prestador=1 AND id_servico=2
  AND observacoes='Atendimento fictício de demonstração'
ON CONFLICT (id_agendamento) DO NOTHING;
