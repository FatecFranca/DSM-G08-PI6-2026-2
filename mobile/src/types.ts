export type UserRole = 'Cliente' | 'Prestador' | 'Admin';
export type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Cancelado' | 'Concluído';

export interface UserProfile {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_perfil: UserRole;
  telefone?: string;
  nome_negocio?: string;
  endereco?: string;
}

export interface Service {
  id_servico: number;
  id_prestador: number;
  titulo: string;
  descricao: string;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  prestador_nome_negocio?: string;
  prestador_endereco?: string;
}

export interface Slot {
  inicio: string;
  fim: string;
}

export interface Appointment {
  id_agendamento: number;
  id_cliente: number;
  id_prestador: number;
  id_servico: number;
  cliente_nome: string;
  prestador_nome?: string;
  servico_titulo: string;
  servico_preco: number;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: AppointmentStatus;
}
