import { Service, Appointment, Slot, SentimentResponse, UserProfile, Review, UserRole } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const GUEST: UserProfile = {
  id_usuario: 0,
  nome: 'Visitante',
  email: '',
  tipo_perfil: 'Cliente'
};

interface ApiError {
  error?: string;
  message?: string;
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const token = localStorage.getItem('agendou_token');
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({})) as T & ApiError;
  if (!response.ok) {
    throw new Error(body.error || body.message || `Falha na API (${response.status}).`);
  }
  return body;
}

export const PERFIS_DEMO: Record<string, UserProfile> = {
  admin: { id_usuario: 3, nome: 'Admin Agendou', email: 'admin@agendou.com', tipo_perfil: 'Admin' },
  prestador: { id_usuario: 1, nome: 'Carlos Barbearia VIP', email: 'prestador@exemplo.com', tipo_perfil: 'Prestador', nome_negocio: 'Barbearia Vintage & Estilo' },
  cliente: { id_usuario: 2, nome: 'Mariana Silva', email: 'cliente@exemplo.com', tipo_perfil: 'Cliente' }
};

export const api = {
  getCurrentUser(): UserProfile {
    try {
      const stored = localStorage.getItem('agendou_user_profile');
      return stored ? JSON.parse(stored) as UserProfile : GUEST;
    } catch (error) {
      console.error('Não foi possível ler o perfil salvo.', error);
      return GUEST;
    }
  },

  setCurrentUser(user: UserProfile, token?: string): void {
    localStorage.setItem('agendou_user_profile', JSON.stringify(user));
    if (token) localStorage.setItem('agendou_token', token);
    window.dispatchEvent(new Event('agendou_auth_changed'));
  },

  logout(): void {
    localStorage.removeItem('agendou_user_profile');
    localStorage.removeItem('agendou_token');
    window.dispatchEvent(new Event('agendou_auth_changed'));
  },

  extrairHora(value: string): string {
    return value
      ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
      : '';
  },

  extrairData(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(value));
  },

  async login(email: string, senha: string): Promise<{ user: UserProfile; token: string }> {
    const result = await request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    this.setCurrentUser(result.user, result.token);
    return result;
  },

  async register(data: {
    nome: string;
    email: string;
    senha: string;
    telefone: string;
    tipo_perfil: Exclude<UserRole, 'Admin'>;
    nome_negocio?: string;
    endereco?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const result = await request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setCurrentUser(result.user, result.token);
    return result;
  },

  async getServices(providerId?: number): Promise<Service[]> {
    const query = providerId ? `?providerId=${providerId}` : '';
    const result = await request<{ services: Service[] }>(`/services${query}`);
    return result.services;
  },

  async createService(data: {
    id_prestador?: number;
    titulo: string;
    descricao: string;
    duracao_minutos: number;
    preco: number;
  }): Promise<Service> {
    const result = await request<{ service: Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data)
    }, true);
    return result.service;
  },

  async updateService(id: number, data: {
    titulo: string;
    descricao: string;
    duracao_minutos: number;
    preco: number;
  }): Promise<Service> {
    const result = await request<{ service: Service }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, true);
    return result.service;
  },

  async deleteService(id: number): Promise<void> {
    await request(`/services/${id}`, { method: 'DELETE' }, true);
  },

  async getAvailableSlots(providerId: number, serviceId: number, date: string): Promise<{ slots: Slot[]; tempoMs: number }> {
    const query = new URLSearchParams({ providerId: String(providerId), serviceId: String(serviceId), date });
    const result = await request<{ slots: Slot[]; tempoExecucaoMs: number }>(`/appointments/available-slots?${query}`);
    return { slots: result.slots, tempoMs: result.tempoExecucaoMs };
  },

  async createAppointment(data: {
    id_cliente?: number;
    id_prestador: number;
    id_servico: number;
    data_hora_inicio: string;
    data_hora_fim?: string;
    observacoes?: string;
  }): Promise<{ message: string; appointment: Appointment }> {
    return request('/appointments', { method: 'POST', body: JSON.stringify(data) }, true);
  },

  async getAppointments(id?: number): Promise<Appointment[]> {
    const user = this.getCurrentUser();
    const params = new URLSearchParams();
    if (user.tipo_perfil === 'Prestador') params.set('providerId', String(user.id_usuario));
    else if (user.tipo_perfil === 'Cliente') params.set('clientId', String(user.id_usuario));
    else if (id) params.set('providerId', String(id));
    const query = params.toString() ? `?${params}` : '';
    const result = await request<{ appointments: Appointment[] }>(`/appointments${query}`, {}, true);
    return result.appointments;
  },

  async getProviderReviews(providerId: number): Promise<{
    totalAvaliacoes: number;
    mediaNotas: number;
    taxaSatisfacaoPercentual: number;
    sentimentos: { positivas: number; negativas: number };
  }> {
    return request(`/reviews/provider/${providerId}`, {}, true);
  },

  async updateAppointmentStatus(id: number, status: Appointment['status']): Promise<void> {
    await request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, true);
  },

  async submitReview(review: {
    id_agendamento: number;
    nota: number;
    comentario: string;
  }): Promise<Review> {
    const result = await request<{ review: Review }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review)
    }, true);
    return result.review;
  },

  async analyzeSentiment(texto: string, nota: number): Promise<SentimentResponse> {
    const result = await request<{
      prediction: { sentimento: 'Positivo' | 'Negativo'; confianca: number };
      performance: { tempoProcessamentoMs: number; rnf02_status: string };
    }>('/ai/sentiment-analysis', {
      method: 'POST',
      body: JSON.stringify({ texto, nota })
    });
    return {
      sentimento: result.prediction.sentimento,
      confianca: result.prediction.confianca,
      tempoProcessamentoMs: result.performance.tempoProcessamentoMs,
      rnf02_status: result.performance.rnf02_status
    };
  }
};
