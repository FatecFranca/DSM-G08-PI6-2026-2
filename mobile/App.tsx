import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from './src/api';
import { Appointment, Service, Slot, UserProfile } from './src/types';

type Page = 'catalog' | 'booking' | 'appointments';

function nextWeekday(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}

function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [page, setPage] = useState<Page>('catalog');
  const [email, setEmail] = useState('cliente@exemplo.com');
  const [password, setPassword] = useState('Agendou2026!');
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState(nextWeekday());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAppointments = useCallback(async () => {
    if (user) setAppointments(await api.getAppointments(user));
  }, [user]);

  const loadAppData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [catalog, history] = await Promise.all([
        api.getServices(),
        api.getAppointments(user),
      ]);
      setServices(catalog);
      setAppointments(history);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync('agendou_token');
        const savedUser = await SecureStore.getItemAsync('agendou_user');
        if (!token || !savedUser) return;
        const profile = JSON.parse(savedUser) as UserProfile;
        const current = await api.getProfile(profile.id_usuario);
        if (active) setUser(current);
      } catch (restoreError) {
        if (active) {
          setError(restoreError instanceof Error ? restoreError.message : 'Não foi possível restaurar sua sessão.');
        }
      }
    }
    void restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user) void loadAppData();
  }, [user, loadAppData]);

  useEffect(() => {
    if (page !== 'booking' || !selectedService) return;
    let active = true;
    setLoading(true);
    setError('');
    setSelectedSlot('');
    api.getAvailableSlots(selectedService.id_prestador, selectedService.id_servico, date)
      .then(result => {
        if (active) {
          setSlots(result.slots);
          setSelectedSlot(result.slots[0]?.inicio || '');
        }
      })
      .catch(loadError => {
        if (active) {
          setSlots([]);
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível consultar os horários.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, page, selectedService]);

  async function handleLogin() {
    setSubmitting(true);
    setError('');
    try {
      const result = await api.login(email.trim(), password);
      await SecureStore.setItemAsync('agendou_token', result.token);
      await SecureStore.setItemAsync('agendou_user', JSON.stringify(result.user));
      setPage('catalog');
      setUser(result.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setServices([]);
    setAppointments([]);
    setPage('catalog');
    setNotice('');
  }

  async function handleBook() {
    if (!selectedService || !selectedSlot) return;
    if (user?.tipo_perfil !== 'Cliente') {
      setError('Entre com uma conta de cliente para solicitar um agendamento.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.createAppointment({
        id_prestador: selectedService.id_prestador,
        id_servico: selectedService.id_servico,
        data_hora_inicio: `${date}T${selectedSlot}:00-03:00`,
        observacoes: 'Solicitado pelo aplicativo móvel',
      });
      setNotice('Agendamento criado com sucesso.');
      setPage('appointments');
      await loadAppointments();
    } catch (bookError) {
      setError(bookError instanceof Error ? bookError.message : 'Não foi possível confirmar o agendamento.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(appointment: Appointment, status: Appointment['status']) {
    setSubmitting(true);
    setError('');
    try {
      await api.updateAppointmentStatus(appointment.id_agendamento, status);
      await loadAppointments();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Não foi possível atualizar o agendamento.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.loginScreen} keyboardShouldPersistTaps="handled">
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>A!</Text></View>
            <Text style={styles.brand}>Agendou!</Text>
            <Text style={styles.subtitle}>Seu próximo atendimento, sem complicação.</Text>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>BEM-VINDO DE VOLTA</Text>
              <Text style={styles.heading}>Entrar na sua conta</Text>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="voce@email.com"
                style={styles.input}
                value={email}
              />
              <Text style={styles.label}>Senha</Text>
              <TextInput
                onChangeText={setPassword}
                onSubmitEditing={() => void handleLogin()}
                placeholder="Sua senha"
                secureTextEntry
                style={styles.input}
                value={password}
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Button label={submitting ? 'Entrando...' : 'Entrar'} onPress={() => void handleLogin()} disabled={submitting} />
              {submitting ? <ActivityIndicator color={colors.ink} style={styles.loader} /> : null}
            </View>
            <Text style={styles.demoHint}>Conta local de demonstração preenchida.{'\n'}A API do projeto é usada para autenticar.</Text>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  const title = page === 'catalog' ? 'Explorar serviços' : page === 'booking' ? 'Escolher horário' : 'Meus agendamentos';
  const isProvider = user.tipo_perfil === 'Prestador';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBrand}>Agendou!</Text>
          <Text style={styles.topGreeting}>Olá, {user.nome.split(' ')[0]}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void handleLogout()} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>{isProvider ? 'ÁREA DO PRESTADOR' : 'AGENDE ONLINE'}</Text>
        <Text style={styles.heading}>{title}</Text>
      </View>

      {error ? <Text accessibilityRole="alert" style={styles.bannerError}>{error}</Text> : null}
      {notice ? <Text style={styles.bannerSuccess}>{notice}</Text> : null}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.ink} size="large" /><Text style={styles.muted}>Carregando...</Text></View>
      ) : page === 'catalog' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {services.length === 0 ? <Text style={styles.empty}>Nenhum serviço ativo encontrado.</Text> : services.map(service => (
            <View key={service.id_servico} style={styles.serviceCard}>
              <View style={styles.serviceIcon}><Text style={styles.serviceIconText}>✂</Text></View>
              <Text style={styles.serviceTitle}>{service.titulo}</Text>
              <Text style={styles.providerName}>{service.prestador_nome_negocio || 'Prestador de serviços'}</Text>
              <Text style={styles.serviceDescription}>{service.descricao || 'Atendimento profissional com hora marcada.'}</Text>
              <View style={styles.serviceMeta}>
                <Text style={styles.metaText}>◷  {service.duracao_minutos} min</Text>
                <Text style={styles.price}>{money(service.preco)}</Text>
              </View>
              <Button
                label={user.tipo_perfil === 'Cliente' ? 'Escolher horário' : 'Entrar como cliente para agendar'}
                onPress={() => {
                  setSelectedService(service);
                  setDate(nextWeekday());
                  setError('');
                  setNotice('');
                  setPage(user.tipo_perfil === 'Cliente' ? 'booking' : 'catalog');
                  if (user.tipo_perfil !== 'Cliente') setError('O agendamento pelo app é feito por uma conta de cliente.');
                }}
              />
            </View>
          ))}
        </ScrollView>
      ) : page === 'booking' && selectedService ? (
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => { setPage('catalog'); setError(''); }} style={styles.backLink}>
            <Text style={styles.backLinkText}>‹  Voltar ao catálogo</Text>
          </Pressable>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>SERVIÇO SELECIONADO</Text>
            <Text style={styles.heading}>{selectedService.titulo}</Text>
            <Text style={styles.muted}>{selectedService.prestador_nome_negocio || 'Prestador'} · {selectedService.duracao_minutos} min · {money(selectedService.preco)}</Text>
            <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setDate}
              placeholder="2026-10-26"
              style={styles.input}
              value={date}
            />
            <Text style={styles.label}>Horários disponíveis</Text>
            {slots.length === 0 ? (
              <Text style={styles.empty}>Nenhum horário livre nessa data. Tente outro dia útil.</Text>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map(slot => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedSlot === slot.inicio }}
                    key={slot.inicio}
                    onPress={() => setSelectedSlot(slot.inicio)}
                    style={[styles.slot, selectedSlot === slot.inicio && styles.slotSelected]}
                  >
                    <Text style={[styles.slotText, selectedSlot === slot.inicio && styles.slotTextSelected]}>{slot.inicio}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Button label={submitting ? 'Confirmando...' : 'Confirmar agendamento'} onPress={() => void handleBook()} disabled={!selectedSlot || submitting} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {appointments.length === 0 ? (
            <View style={styles.card}><Text style={styles.empty}>Você ainda não tem agendamentos.</Text></View>
          ) : appointments.map(appointment => (
            <View key={appointment.id_agendamento} style={styles.appointmentCard}>
              <View style={styles.appointmentTop}>
                <Text style={styles.serviceTitle}>{appointment.servico_titulo}</Text>
                <Text style={[styles.status, appointment.status === 'Concluído' ? styles.statusDone : null]}>{appointment.status}</Text>
              </View>
              <Text style={styles.providerName}>{isProvider ? appointment.cliente_nome : appointment.prestador_nome || 'Prestador'}</Text>
              <Text style={styles.appointmentDate}>{formatDate(appointment.data_hora_inicio)} · {formatTime(appointment.data_hora_inicio)}</Text>
              <Text style={styles.price}>{money(appointment.servico_preco)}</Text>
              {appointment.status !== 'Cancelado' && appointment.status !== 'Concluído' && (
                <Button
                  label={submitting ? 'Atualizando...' : isProvider ? 'Marcar como concluído' : 'Cancelar agendamento'}
                  onPress={() => void handleStatus(appointment, isProvider ? 'Concluído' : 'Cancelado')}
                  secondary={!isProvider}
                  disabled={submitting}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.tabBar}>
        <Tab label="Serviços" active={page === 'catalog' || page === 'booking'} onPress={() => { setPage('catalog'); setError(''); }} />
        <Tab label="Agendamentos" active={page === 'appointments'} onPress={() => { setPage('appointments'); setNotice(''); setError(''); void loadAppData(); }} />
      </View>
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled = false, secondary = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={styles.tab}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const colors = {
  ink: '#29241f',
  muted: '#766e65',
  line: '#e6dfd6',
  paper: '#faf8f5',
  white: '#ffffff',
  sage: '#e2eadf',
  sageInk: '#35513b',
  error: '#9f3434',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  safeArea: { flex: 1 },
  loginScreen: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 50, paddingBottom: 40 },
  brandMark: { width: 58, height: 58, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderRadius: 16 },
  brandMarkText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  brand: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 6, marginBottom: 28 },
  card: { backgroundColor: colors.white, padding: 20, borderColor: colors.line, borderWidth: 1, borderRadius: 18 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  heading: { color: colors.ink, fontSize: 23, fontWeight: '800', marginBottom: 12 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 7 },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink, fontSize: 15 },
  button: { backgroundColor: colors.ink, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 11, paddingHorizontal: 16, marginTop: 18 },
  buttonSecondary: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1 },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.82 },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  buttonTextSecondary: { color: colors.ink },
  demoHint: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 19, marginTop: 20 },
  loader: { marginTop: 14 },
  error: { color: colors.error, fontSize: 13, marginTop: 12 },
  topBar: { paddingHorizontal: 20, paddingVertical: 13, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBrand: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  topGreeting: { color: colors.muted, fontSize: 12, marginTop: 2 },
  logoutButton: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9, backgroundColor: colors.paper },
  logoutText: { color: colors.ink, fontWeight: '700', fontSize: 12 },
  pageHeader: { paddingHorizontal: 20, paddingTop: 23, paddingBottom: 10 },
  bannerError: { color: colors.error, backgroundColor: '#fbe9e7', padding: 12, marginHorizontal: 20, marginBottom: 8, borderRadius: 10, fontSize: 13 },
  bannerSuccess: { color: colors.sageInk, backgroundColor: colors.sage, padding: 12, marginHorizontal: 20, marginBottom: 8, borderRadius: 10, fontSize: 13 },
  list: { padding: 16, paddingBottom: 25, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 21, paddingVertical: 18 },
  serviceCard: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 17 },
  serviceIcon: { width: 38, height: 38, backgroundColor: colors.sage, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  serviceIconText: { color: colors.sageInk, fontSize: 19, fontWeight: '700' },
  serviceTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  providerName: { color: colors.sageInk, fontSize: 12, fontWeight: '700', marginTop: 4 },
  serviceDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 9 },
  serviceMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 13, marginTop: 12, borderTopColor: colors.line, borderTopWidth: 1 },
  metaText: { color: colors.muted, fontSize: 12 },
  price: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 8 },
  backLink: { paddingVertical: 3, alignSelf: 'flex-start' },
  backLinkText: { color: colors.sageInk, fontWeight: '700', fontSize: 13 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 5 },
  slot: { minWidth: '22%', borderColor: colors.line, borderWidth: 1, borderRadius: 9, paddingVertical: 11, paddingHorizontal: 10, alignItems: 'center', backgroundColor: colors.paper },
  slotSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  slotText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  slotTextSelected: { color: colors.white },
  appointmentCard: { backgroundColor: colors.white, padding: 17, borderColor: colors.line, borderWidth: 1, borderRadius: 15 },
  appointmentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  status: { color: colors.ink, backgroundColor: colors.paper, overflow: 'hidden', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '800' },
  statusDone: { color: colors.sageInk, backgroundColor: colors.sage },
  appointmentDate: { color: colors.muted, fontSize: 13, marginTop: 11 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 14 : 5 },
  tab: { flex: 1, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.ink, fontWeight: '900' },
});
