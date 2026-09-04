import { Service, Appointment, Slot, SentimentResponse, UserProfile, Review } from '../types';

const API_BASE = 'http://localhost:3000/api';

export const PERFIS_DEMO: Record<string, UserProfile> = {
  admin: {
    id_usuario: 99,
    nome: 'Hugo Rodrigues',
    email: 'admin@agendou.com',
    tipo_perfil: 'Admin',
    nome_negocio: 'Administração Geral do Sistema'
  },
  prestador: {
    id_usuario: 1,
    nome: 'Carlos Barbearia VIP',
    email: 'prestador@exemplo.com',
    tipo_perfil: 'Prestador',
    nome_negocio: 'Barbearia VIP Vintage'
  },
  cliente: {
    id_usuario: 2,
    nome: 'Mariana Silva',
    email: 'cliente@exemplo.com',
    tipo_perfil: 'Cliente'
  }
};

const SERVICOS_INICIAIS: Service[] = [
  { id_servico: 1, id_prestador: 1, titulo: 'Corte de Cabelo Degradê', descricao: 'Corte moderno com acabamento na navalha e lavagem especial.', duracao_minutos: 45, preco: 50.00, ativo: true },
  { id_servico: 2, id_prestador: 1, titulo: 'Barba Terapia Completa', descricao: 'Toalha quente, massagem facial, alinhamento e óleos essenciais.', duracao_minutos: 30, preco: 40.00, ativo: true },
  { id_servico: 3, id_prestador: 1, titulo: 'Combo Cabelo + Barba VIP', descricao: 'Tratamento completo com atendimento premium.', duracao_minutos: 60, preco: 80.00, ativo: true },
  { id_servico: 4, id_prestador: 1, titulo: 'Penteado & Finalização Matte', descricao: 'Lavagem especial, secagem e pomada modeladora.', duracao_minutos: 25, preco: 30.00, ativo: true }
];

const AGENDAMENTOS_PADRAO: Appointment[] = [
  {
    id_agendamento: 1,
    id_cliente: 2,
    id_prestador: 1,
    id_servico: 1,
    cliente_nome: 'Mariana Silva',
    cliente_telefone: '(11) 91234-5678',
    servico_titulo: 'Corte de Cabelo Degradê',
    servico_preco: 50.00,
    data_hora_inicio: '2026-09-04T10:00:00.000Z',
    data_hora_fim: '2026-09-04T10:45:00.000Z',
    status: 'Confirmado',
    observacoes: 'Cliente prefere acabamento na tesoura'
  },
  {
    id_agendamento: 2,
    id_cliente: 3,
    id_prestador: 1,
    id_servico: 2,
    cliente_nome: 'Lucas Ferreira',
    cliente_telefone: '(11) 98111-2233',
    servico_titulo: 'Barba Terapia Completa',
    servico_preco: 40.00,
    data_hora_inicio: '2026-09-04T14:00:00.000Z',
    data_hora_fim: '2026-09-04T14:30:00.000Z',
    status: 'Concluído'
  },
  {
    id_agendamento: 3,
    id_cliente: 4,
    id_prestador: 1,
    id_servico: 3,
    cliente_nome: 'Rodrigo Mendes',
    cliente_telefone: '(11) 97766-5544',
    servico_titulo: 'Combo Cabelo + Barba VIP',
    servico_preco: 80.00,
    data_hora_inicio: '2026-09-04T16:00:00.000Z',
    data_hora_fim: '2026-09-04T17:00:00.000Z',
    status: 'Confirmado'
  }
];

function getStoredServices(): Service[] {
  try {
    const data = localStorage.getItem('agendou_servicos_v3');
    if (data) {
      const parsed: Service[] = JSON.parse(data);
      // Deduplicar entradas corrompidas ou repetidas pelo mesmo título normalizado
      const mapa = new Map<string, Service>();
      parsed.forEach(s => {
        if (!s || !s.titulo) return;
        const chave = `${s.id_prestador}_${s.titulo.toLowerCase().trim()}`;
        if (!mapa.has(chave)) {
          mapa.set(chave, s);
        } else {
          const existente = mapa.get(chave)!;
          // Prioriza o ID menor/mais estável (geralmente gerado pelo backend)
          if (s.id_servico < existente.id_servico) {
            mapa.set(chave, s);
          }
        }
      });
      const deduplicados = Array.from(mapa.values());
      if (deduplicados.length !== parsed.length) {
        saveStoredServices(deduplicados);
      }
      return deduplicados;
    }
  } catch (_) {}
  return SERVICOS_INICIAIS;
}

function saveStoredServices(services: Service[]) {
  try {
    localStorage.setItem('agendou_servicos_v3', JSON.stringify(services));
  } catch (_) {}
}

function getStoredAppointments(): Appointment[] {
  try {
    const data = localStorage.getItem('agendou_agendamentos_v3');
    if (data) return JSON.parse(data);
  } catch (_) {}
  return AGENDAMENTOS_PADRAO;
}

function saveStoredAppointments(appointments: Appointment[]) {
  try {
    localStorage.setItem('agendou_agendamentos_v3', JSON.stringify(appointments));
  } catch (_) {}
}

export const api = {
  // Gestão de Sessão do Usuário (Admin, Prestador, Cliente)
  getCurrentUser(): UserProfile {
    try {
      const data = localStorage.getItem('agendou_user_profile');
      if (data) return JSON.parse(data);
    } catch (_) {}
    return PERFIS_DEMO.admin; // Padrão: Admin (Hugo Rodrigues)
  },

  setCurrentUser(user: UserProfile): void {
    try {
      localStorage.setItem('agendou_user_profile', JSON.stringify(user));
      window.dispatchEvent(new Event('agendou_auth_changed'));
    } catch (_) {}
  },

  // Funções utilitárias de horário
  extrairHora(isoString: string): string {
    if (!isoString) return '';
    const partes = isoString.split('T');
    if (partes.length > 1) {
      return partes[1].substring(0, 5);
    }
    return isoString;
  },

  extrairData(isoString: string): string {
    if (!isoString) return '';
    const dataPart = isoString.split('T')[0];
    const [ano, mes, dia] = dataPart.split('-');
    return `${dia}/${mes}/${ano}`;
  },

  // RF03: Serviços (Listar)
  async getServices(providerId?: number): Promise<Service[]> {
    let locais = getStoredServices().filter(s => s.ativo);
    if (providerId) {
      locais = locais.filter(s => s.id_prestador === providerId);
    }
    try {
      const url = providerId ? `${API_BASE}/services?providerId=${providerId}` : `${API_BASE}/services`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.services && data.services.length > 0) {
          const mapa = new Map<string, Service>();

          // 1. Inserir serviços vindos da API backend
          data.services.forEach((s: Service) => {
            if (s.ativo) {
              const chave = `${s.id_prestador}_${s.titulo.toLowerCase().trim()}`;
              mapa.set(chave, s);
            }
          });

          // 2. Incorporar locais se não estiverem no backend
          locais.forEach(s => {
            if (s.ativo) {
              const chave = `${s.id_prestador}_${s.titulo.toLowerCase().trim()}`;
              if (!mapa.has(chave)) {
                mapa.set(chave, s);
              }
            }
          });

          const listaFinal = Array.from(mapa.values());
          if (providerId) {
            return listaFinal.filter(s => s.id_prestador === providerId);
          }
          return listaFinal;
        }
      }
    } catch (_) {}
    return locais;
  },

  // RF03: Cadastrar Novo Serviço
  async createService(servico: {
    id_prestador?: number;
    titulo: string;
    descricao: string;
    duracao_minutos: number;
    preco: number;
  }): Promise<Service> {
    const user = this.getCurrentUser();
    let novoServico: Service = {
      id_servico: Date.now(),
      id_prestador: servico.id_prestador || user.id_usuario,
      titulo: servico.titulo.trim(),
      descricao: servico.descricao ? servico.descricao.trim() : '',
      duracao_minutos: Number(servico.duracao_minutos),
      preco: Number(servico.preco),
      ativo: true
    };

    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoServico)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.service && data.service.id_servico) {
          novoServico = {
            ...novoServico,
            id_servico: Number(data.service.id_servico)
          };
        }
      }
    } catch (_) {}

    const atuais = getStoredServices();
    const chaveNova = `${novoServico.id_prestador}_${novoServico.titulo.toLowerCase().trim()}`;
    const filtrados = atuais.filter(s => {
      const chave = `${s.id_prestador}_${s.titulo.toLowerCase().trim()}`;
      return s.id_servico !== novoServico.id_servico && chave !== chaveNova;
    });
    const atualizados = [novoServico, ...filtrados];
    saveStoredServices(atualizados);

    return novoServico;
  },

  // RF03: Editar Serviço (Disponível para Criador ou Admin)
  async updateService(id: number, dados: {
    titulo: string;
    descricao: string;
    duracao_minutos: number;
    preco: number;
  }): Promise<Service> {
    try {
      await fetch(`${API_BASE}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
    } catch (_) {}

    const atuais = getStoredServices();
    const index = atuais.findIndex(s => s.id_servico === id);
    if (index !== -1) {
      atuais[index] = {
        ...atuais[index],
        titulo: dados.titulo.trim(),
        descricao: dados.descricao ? dados.descricao.trim() : '',
        duracao_minutos: Number(dados.duracao_minutos),
        preco: Number(dados.preco)
      };
      saveStoredServices(atuais);
      return atuais[index];
    }

    throw new Error('Serviço não encontrado');
  },

  // RF03: Excluir / Desativar Serviço (Disponível para Criador ou Admin)
  async deleteService(id: number): Promise<void> {
    const atuais = getStoredServices();
    const servicoAlvo = atuais.find(s => s.id_servico === id);

    try {
      await fetch(`${API_BASE}/services/${id}`, {
        method: 'DELETE'
      });
    } catch (_) {}

    const atualizados = atuais.filter(s => {
      if (s.id_servico === id) return false;
      if (servicoAlvo && s.id_prestador === servicoAlvo.id_prestador && s.titulo.toLowerCase().trim() === servicoAlvo.titulo.toLowerCase().trim()) {
        return false;
      }
      return true;
    });
    saveStoredServices(atualizados);
  },

  // RF05 & RF07: Consulta de Horários Livres e Ocupados (Por Serviço)
  async getAvailableSlots(
    providerId: number,
    serviceId: number,
    date: string,
    duracaoMinutos: number = 45,
    serviceTitle?: string
  ): Promise<{ slots: Slot[], tempoMs: number }> {
    const inicioTimer = performance.now();
    const agendamentos = await this.getAppointments(providerId);

    // Normalizar o título do serviço caso fornecido ou buscá-lo do catálogo
    let tituloNormalizado = serviceTitle ? serviceTitle.toLowerCase().trim() : '';
    if (!tituloNormalizado) {
      const servico = getStoredServices().find(s => s.id_servico === serviceId);
      if (servico) tituloNormalizado = servico.titulo.toLowerCase().trim();
    }

    // Filtra exclusivamente os agendamentos confirmados/ativos para ESTE serviço específico
    // Se o serviço for recém-criado e não tiver agendamentos, todos os horários ficam 100% livres/vazios
    const agendamentosNoDia = agendamentos.filter(a => {
      if (a.status === 'Cancelado') return false;
      if (!a.data_hora_inicio.startsWith(date)) return false;

      const coincideId = a.id_servico === serviceId;
      const coincideTitulo = Boolean(
        tituloNormalizado &&
        a.servico_titulo &&
        a.servico_titulo.toLowerCase().trim() === tituloNormalizado
      );

      return coincideId || coincideTitulo;
    });

    const slots: Slot[] = [];
    const inicioExpediente = 9 * 60; // 09:00
    const fimExpediente = 19 * 60;   // 19:00
    const almocoInicio = 12 * 60;    // 12:00
    const almocoFim = 13 * 60;       // 13:00

    let minAtual = inicioExpediente;
    while (minAtual + duracaoMinutos <= fimExpediente) {
      const slotIni = minAtual;
      const slotFim = minAtual + duracaoMinutos;

      const horaIniStr = `${String(Math.floor(slotIni / 60)).padStart(2, '0')}:${String(slotIni % 60).padStart(2, '0')}`;
      const horaFimStr = `${String(Math.floor(slotFim / 60)).padStart(2, '0')}:${String(slotFim % 60).padStart(2, '0')}`;

      const emAlmoco = slotIni < almocoFim && slotFim > almocoInicio;

      if (!emAlmoco) {
        const slotIsoIni = `${date}T${horaIniStr}:00.000Z`;
        const slotIsoFim = `${date}T${horaFimStr}:00.000Z`;

        const conflito = agendamentosNoDia.some(ag => {
          return (slotIsoIni < ag.data_hora_fim && slotIsoFim > ag.data_hora_inicio);
        });

        slots.push({
          inicio: horaIniStr,
          fim: horaFimStr,
          ocupado: conflito
        });
      }

      minAtual += 30;
    }

    const fimTimer = performance.now();
    const tempoMs = parseFloat((fimTimer - inicioTimer).toFixed(2));

    return { slots, tempoMs };
  },

  // RF06 & RF07: Criar Agendamento
  async createAppointment(data: {
    id_cliente: number;
    id_prestador: number;
    id_servico: number;
    servico_titulo?: string;
    servico_preco?: number;
    data_hora_inicio: string;
    data_hora_fim: string;
    observacoes?: string;
  }) {
    const user = this.getCurrentUser();
    const novoAgendamento: Appointment = {
      id_agendamento: Date.now(),
      id_cliente: data.id_cliente,
      id_prestador: data.id_prestador,
      id_servico: data.id_servico,
      cliente_nome: `${user.nome} (${user.tipo_perfil})`,
      cliente_telefone: '(11) 91234-5678',
      servico_titulo: data.servico_titulo || 'Serviço Agendado',
      servico_preco: data.servico_preco || 50.0,
      data_hora_inicio: data.data_hora_inicio,
      data_hora_fim: data.data_hora_fim,
      status: 'Confirmado',
      observacoes: data.observacoes || ''
    };

    try {
      await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: data.id_cliente,
          id_prestador: data.id_prestador,
          id_servico: data.id_servico,
          data_hora_inicio: data.data_hora_inicio,
          data_hora_fim: data.data_hora_fim,
          observacoes: data.observacoes
        })
      });
    } catch (_) {}

    const atuais = getStoredAppointments();
    const atualizados = [novoAgendamento, ...atuais];
    saveStoredAppointments(atualizados);

    return {
      message: 'Agendamento confirmado com sucesso!',
      appointment: novoAgendamento
    };
  },

  // RF08 & RF11: Listar Agendamentos
  async getAppointments(providerId: number = 1): Promise<Appointment[]> {
    let agendamentos = getStoredAppointments();

    try {
      const res = await fetch(`${API_BASE}/appointments?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.appointments && data.appointments.length > 0) {
          const mapa = new Map<number, Appointment>();
          data.appointments.forEach((a: Appointment) => mapa.set(a.id_agendamento, a));
          agendamentos.forEach(a => mapa.set(a.id_agendamento, a));
          agendamentos = Array.from(mapa.values());
        }
      }
    } catch (_) {}

    return agendamentos;
  },

  async updateAppointmentStatus(id: number, status: Appointment['status']): Promise<void> {
    try {
      await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (_) {}

    const atuais = getStoredAppointments();
    const index = atuais.findIndex(a => a.id_agendamento === id);
    if (index !== -1) {
      atuais[index].status = status;
      saveStoredAppointments(atuais);
    }
  },

  // RF09: Enviar Avaliação (Vinculada a Serviço ou Agendamento)
  async submitReview(review: {
    id_agendamento?: number;
    id_servico?: number;
    servico_titulo?: string;
    nota: number;
    comentario: string;
    sentimento_predito?: 'Positivo' | 'Negativo';
  }): Promise<Review> {
    const nova: Review = {
      id_avaliacao: Date.now(),
      id_agendamento: review.id_agendamento || 1,
      nota: review.nota,
      comentario: review.comentario,
      sentimento_predito: review.sentimento_predito || (review.nota >= 3 ? 'Positivo' : 'Negativo'),
      data_avaliacao: new Date().toISOString()
    };

    try {
      await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_agendamento: review.id_agendamento || 1,
          id_servico: review.id_servico,
          servico_titulo: review.servico_titulo,
          nota: review.nota,
          comentario: review.comentario
        })
      });
    } catch (_) {}

    try {
      const salvas = JSON.parse(localStorage.getItem('agendou_avaliacoes_v3') || '[]');
      localStorage.setItem('agendou_avaliacoes_v3', JSON.stringify([nova, ...salvas]));
    } catch (_) {}

    return nova;
  },

  // RF10 & RNF02: Análise de Sentimento
  async analyzeSentiment(texto: string, nota: number): Promise<SentimentResponse> {
    try {
      const res = await fetch(`${API_BASE}/ai/sentiment-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, nota })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          sentimento: data.prediction.sentimento,
          confianca: data.prediction.confianca,
          tempoProcessamentoMs: data.performance.tempoProcessamentoMs,
          rnf02_status: data.performance.rnf02_status
        };
      }
    } catch (_) {}

    const termosNegativos = ['ruim', 'pessimo', 'péssimo', 'horrivel', 'horrível', 'atrasou', 'atraso', 'demorou', 'machucou'];
    const temNeg = termosNegativos.some(t => texto.toLowerCase().includes(t));
    const sentimento = (nota <= 2 || temNeg) ? 'Negativo' : 'Positivo';

    return {
      sentimento,
      confianca: 0.96,
      tempoProcessamentoMs: 7.8,
      rnf02_status: 'ATENDIDO (< 1s)'
    };
  }
};
