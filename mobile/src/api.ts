import * as SecureStore from 'expo-secure-store';
import { Appointment, AppointmentStatus, Service, Slot, UserProfile } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ||
  (process.env.EXPO_OS === 'ios' ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api');

interface ApiError {
  error?: string;
  message?: string;
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (authenticated) {
    const token = await SecureStore.getItemAsync('agendou_token');
    if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Não foi possível acessar a API em ${API_BASE}. Confira se a API está rodando e se o endereço está correto.`);
  }

  const body = await response.json().catch(() => ({})) as T & ApiError;
  if (!response.ok) throw new Error(body.error || body.message || `Falha na API (${response.status}).`);
  return body;
}

export const api = {
  async login(email: string, senha: string): Promise<{ user: UserProfile; token: string }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
  },

  async getProfile(id: number): Promise<UserProfile> {
    return request(`/auth/profile/${id}`, {}, true);
  },

  async getServices(): Promise<Service[]> {
    const response = await request<{ services: Service[] }>('/services');
    return response.services;
  },

  async getAvailableSlots(providerId: number, serviceId: number, date: string): Promise<{ slots: Slot[]; elapsedMs: number }> {
    const query = new URLSearchParams({ providerId: String(providerId), serviceId: String(serviceId), date });
    const response = await request<{ slots: Slot[]; tempoExecucaoMs: number }>(`/appointments/available-slots?${query}`);
    return { slots: response.slots, elapsedMs: response.tempoExecucaoMs };
  },

  async createAppointment(data: {
    id_prestador: number;
    id_servico: number;
    data_hora_inicio: string;
    observacoes: string;
  }): Promise<Appointment> {
    const response = await request<{ appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
    return response.appointment;
  },

  async getAppointments(user: UserProfile): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (user.tipo_perfil === 'Prestador') params.set('providerId', String(user.id_usuario));
    else if (user.tipo_perfil === 'Cliente') params.set('clientId', String(user.id_usuario));
    const query = params.toString() ? `?${params}` : '';
    const response = await request<{ appointments: Appointment[] }>(`/appointments${query}`, {}, true);
    return response.appointments;
  },

  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<void> {
    await request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true);
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('agendou_token');
    await SecureStore.deleteItemAsync('agendou_user');
  },
};
