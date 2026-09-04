// Simulação de banco de dados em memória para testes imediatos da 1ª Sprint
// Preparado para migração transparente para PostgreSQL/Prisma na 2ª Sprint

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  senha_hash: string;
  telefone: string;
  tipo_perfil: 'Cliente' | 'Prestador' | 'Admin';
  nome_negocio?: string;
  endereco?: string;
  foto_perfil?: string;
}

export interface Servico {
  id_servico: number;
  id_prestador: number;
  titulo: string;
  descricao: string;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
}

export interface JornadaTrabalho {
  id_jornada: number;
  id_prestador: number;
  dia_semana: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  hora_inicio: string; // "08:00"
  hora_fim: string; // "18:00"
  inicio_intervalo?: string; // "12:00"
  fim_intervalo?: string; // "13:00"
  ativo: boolean;
}

export interface Agendamento {
  id_agendamento: number;
  id_cliente: number;
  id_prestador: number;
  id_servico: number;
  data_hora_inicio: string; // ISO 8601
  data_hora_fim: string; // ISO 8601
  status: 'Pendente' | 'Confirmado' | 'Cancelado' | 'Concluído';
  observacoes?: string;
}

export interface Avaliacao {
  id_avaliacao: number;
  id_agendamento: number;
  nota: number; // 1 a 5
  comentario: string;
  sentimento_predito: 'Positivo' | 'Negativo';
  data_avaliacao: string;
}

// Seed inicial para testes imediatos
export const db = {
  usuarios: [
    {
      id_usuario: 1,
      nome: 'Carlos Barbearia VIP',
      email: 'prestador@exemplo.com',
      senha_hash: '$2b$10$w8T0M4eXq...',
      telefone: '(11) 98765-4321',
      tipo_perfil: 'Prestador',
      nome_negocio: 'Barbearia Vintage & Estilo',
      endereco: 'Av. Paulista, 1000 - Bela Vista, SP',
      foto_perfil: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300'
    },
    {
      id_usuario: 2,
      nome: 'Mariana Silva',
      email: 'cliente@exemplo.com',
      senha_hash: '$2b$10$w8T0M4eXq...',
      telefone: '(11) 91234-5678',
      tipo_perfil: 'Cliente'
    }
  ] as Usuario[],

  servicos: [
    {
      id_servico: 1,
      id_prestador: 1,
      titulo: 'Corte de Cabelo Degradê',
      descricao: 'Corte moderno com acabamento na navalha e lavagem especial.',
      duracao_minutos: 45,
      preco: 50.00,
      ativo: true
    },
    {
      id_servico: 2,
      id_prestador: 1,
      titulo: 'Barba Terapia Completa',
      descricao: 'Toalha quente, massagem facial, alinhamento e hidratação com óleos essenciais.',
      duracao_minutos: 30,
      preco: 40.00,
      ativo: true
    },
    {
      id_servico: 3,
      id_prestador: 1,
      titulo: 'Combo Cabelo + Barba',
      descricao: 'Tratamento completo para cabelo e barba com atendimento premium.',
      duracao_minutos: 60,
      preco: 80.00,
      ativo: true
    }
  ] as Servico[],

  jornadas: [
    {
      id_jornada: 1,
      id_prestador: 1,
      dia_semana: 1, // Segunda
      hora_inicio: '09:00',
      hora_fim: '18:00',
      inicio_intervalo: '12:00',
      fim_intervalo: '13:00',
      ativo: true
    },
    {
      id_jornada: 2,
      id_prestador: 1,
      dia_semana: 2, // Terça
      hora_inicio: '09:00',
      hora_fim: '18:00',
      inicio_intervalo: '12:00',
      fim_intervalo: '13:00',
      ativo: true
    },
    {
      id_jornada: 3,
      id_prestador: 1,
      dia_semana: 3, // Quarta
      hora_inicio: '09:00',
      hora_fim: '18:00',
      inicio_intervalo: '12:00',
      fim_intervalo: '13:00',
      ativo: true
    },
    {
      id_jornada: 4,
      id_prestador: 1,
      dia_semana: 4, // Quinta
      hora_inicio: '09:00',
      hora_fim: '18:00',
      inicio_intervalo: '12:00',
      fim_intervalo: '13:00',
      ativo: true
    },
    {
      id_jornada: 5,
      id_prestador: 1,
      dia_semana: 5, // Sexta
      hora_inicio: '09:00',
      hora_fim: '19:00',
      inicio_intervalo: '12:00',
      fim_intervalo: '13:00',
      ativo: true
    }
  ] as JornadaTrabalho[],

  agendamentos: [
    {
      id_agendamento: 1,
      id_cliente: 2,
      id_prestador: 1,
      id_servico: 1,
      data_hora_inicio: '2026-09-04T10:00:00.000Z',
      data_hora_fim: '2026-09-04T10:45:00.000Z',
      status: 'Confirmado',
      observacoes: 'Cliente prefere tesoura na parte superior'
    },
    {
      id_agendamento: 2,
      id_cliente: 2,
      id_prestador: 1,
      id_servico: 2,
      data_hora_inicio: '2026-09-04T14:00:00.000Z',
      data_hora_fim: '2026-09-04T14:30:00.000Z',
      status: 'Concluído',
      observacoes: 'Atendimento finalizado com sucesso'
    }
  ] as Agendamento[],

  avaliacoes: [
    {
      id_avaliacao: 1,
      id_agendamento: 2,
      nota: 5,
      comentario: 'Serviço excelente! O profissional foi muito pontual e atencioso.',
      sentimento_predito: 'Positivo',
      data_avaliacao: '2026-09-04T15:00:00.000Z'
    }
  ] as Avaliacao[]
};
