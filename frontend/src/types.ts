export interface Service {
  id_servico: number;
  id_prestador: number;
  titulo: string;
  descricao: string;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
}

export interface Slot {
  inicio: string;
  fim: string;
  ocupado?: boolean;
}

export interface Appointment {
  id_agendamento: number;
  id_cliente: number;
  id_prestador: number;
  id_servico: number;
  cliente_nome: string;
  cliente_telefone: string;
  servico_titulo: string;
  servico_preco: number;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado' | 'Concluído';
  observacoes?: string;
}

export interface Review {
  id_avaliacao: number;
  id_agendamento: number;
  nota: number;
  comentario: string;
  sentimento_predito: 'Positivo' | 'Negativo';
  data_avaliacao: string;
}

export interface SentimentResponse {
  sentimento: 'Positivo' | 'Negativo';
  confianca: number;
  tempoProcessamentoMs: number;
  rnf02_status: string;
}
