import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { X, Clock, Save } from 'lucide-react';

interface ModalJornadaProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (mensagem: string) => void;
}

interface DiaJornada {
  dia_semana: number;
  ativo: boolean;
  hora_inicio: string;
  hora_fim: string;
  inicio_intervalo: string;
  fim_intervalo: string;
}

const DIAS = [
  { dia: 0, label: 'Domingo' },
  { dia: 1, label: 'Segunda-feira' },
  { dia: 2, label: 'Terça-feira' },
  { dia: 3, label: 'Quarta-feira' },
  { dia: 4, label: 'Quinta-feira' },
  { dia: 5, label: 'Sexta-feira' },
  { dia: 6, label: 'Sábado' }
];

const DIA_VAZIO: Omit<DiaJornada, 'dia_semana'> = {
  ativo: false,
  hora_inicio: '09:00',
  hora_fim: '18:00',
  inicio_intervalo: '',
  fim_intervalo: ''
};

// Editor da jornada de trabalho semanal do prestador. Cada dia ativo é
// salvo em /api/schedule (upsert por prestador + dia_semana). Os horários
// configurados alimentam os slots disponíveis na tela de agendamento.
export const ModalJornada: React.FC<ModalJornadaProps> = ({ isOpen, onClose, onSaved }) => {
  const [dias, setDias] = useState<DiaJornada[]>(DIAS.map(d => ({ dia_semana: d.dia, ...DIA_VAZIO })));
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const usuario = api.getCurrentUser();

  useEffect(() => {
    if (!isOpen) return;
    setErro('');
    setCarregando(true);
    const providerId = usuario.tipo_perfil === 'Admin' ? 1 : usuario.id_usuario;
    api.getSchedule(providerId).then(({ schedules }) => {
      setDias(prev => prev.map(d => {
        const existente = schedules.find((s: { dia_semana: number }) => s.dia_semana === d.dia_semana);
        return existente
          ? {
              dia_semana: d.dia_semana,
              ativo: true,
              hora_inicio: existente.hora_inicio.slice(0, 5),
              hora_fim: existente.hora_fim.slice(0, 5),
              inicio_intervalo: existente.inicio_intervalo ? String(existente.inicio_intervalo).slice(0, 5) : '',
              fim_intervalo: existente.fim_intervalo ? String(existente.fim_intervalo).slice(0, 5) : ''
            }
          : d;
      }));
    }).catch(error => {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar a jornada atual.');
    }).finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const atualizarDia = (dia_semana: number, campo: keyof Omit<DiaJornada, 'dia_semana'>, valor: string | boolean) => {
    setDias(prev => prev.map(d => (d.dia_semana === dia_semana ? { ...d, [campo]: valor } : d)));
  };

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      const ativos = dias.filter(d => d.ativo);
      if (ativos.length === 0) {
        setErro('Ative pelo menos um dia da semana para que os clientes possam agendar.');
        return;
      }
      for (const dia of ativos) {
        if (!dia.hora_inicio || !dia.hora_fim || dia.hora_fim <= dia.hora_inicio) {
          setErro(`Verifique os horários de ${DIAS.find(x => x.dia === dia.dia_semana)?.label}: fim deve ser depois do início.`);
          return;
        }
        if (Boolean(dia.inicio_intervalo) !== Boolean(dia.fim_intervalo)) {
          setErro(`Em ${DIAS.find(x => x.dia === dia.dia_semana)?.label}, preencha o intervalo completo ou deixe os dois campos vazios.`);
          return;
        }
      }
      for (const dia of ativos) {
        await api.saveSchedule({
          dia_semana: dia.dia_semana,
          hora_inicio: dia.hora_inicio,
          hora_fim: dia.hora_fim,
          inicio_intervalo: dia.inicio_intervalo || undefined,
          fim_intervalo: dia.fim_intervalo || undefined
        });
      }
      onSaved(`Jornada salva para ${ativos.length} dia(s): os horários já estão disponíveis para agendamento.`);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar a jornada.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 max-w-2xl w-full text-left border-2 border-stone-900 space-y-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Expediente</span>
            <h3 className="text-xl font-normal text-stone-900 uppercase tracking-tight mt-0.5">Jornada de Trabalho</h3>
            <p className="text-xs text-stone-500 font-mono mt-1">Define os horários em que clientes podem agendar seus serviços.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-stone-300 hover:border-stone-900 hover:bg-pastel-cream transition text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); salvar(); }} className="space-y-3 font-mono text-xs">
          {erro && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-red-800">{erro}</p>}
          {carregando ? (
            <p className="py-6 text-center text-stone-400">Carregando jornada atual...</p>
          ) : (
            <div className="space-y-2">
              {dias.map(dia => {
                const label = DIAS.find(x => x.dia === dia.dia_semana)?.label || '';
                return (
                  <div
                    key={dia.dia_semana}
                    className={`p-3 border ${dia.ativo ? 'bg-pastel-cream border-pastel-sage-dark/40' : 'bg-white border-stone-200'}`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <label className="flex items-center space-x-2 font-bold text-stone-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dia.ativo}
                          onChange={e => atualizarDia(dia.dia_semana, 'ativo', e.target.checked)}
                          className="w-4 h-4 accent-stone-900"
                        />
                        <span>{label}</span>
                      </label>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-stone-500">Início:</span>
                        <input
                          type="time"
                          value={dia.hora_inicio}
                          disabled={!dia.ativo}
                          onChange={e => atualizarDia(dia.dia_semana, 'hora_inicio', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900 disabled:opacity-40"
                        />
                        <span className="text-stone-500">Fim:</span>
                        <input
                          type="time"
                          value={dia.hora_fim}
                          disabled={!dia.ativo}
                          onChange={e => atualizarDia(dia.dia_semana, 'hora_fim', e.target.value)}
                          className="px-2 py-1.5 bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900 disabled:opacity-40"
                        />
                      </div>
                    </div>

                    {dia.ativo && (
                      <div className="flex items-center gap-3 text-[11px] mt-2 pt-2 border-t border-stone-200">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span className="text-stone-500">Intervalo (opcional):</span>
                        <input
                          type="time"
                          value={dia.inicio_intervalo}
                          onChange={e => atualizarDia(dia.dia_semana, 'inicio_intervalo', e.target.value)}
                          className="px-2 py-1 bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900"
                        />
                        <span className="text-stone-400">até</span>
                        <input
                          type="time"
                          value={dia.fim_intervalo}
                          onChange={e => atualizarDia(dia.dia_semana, 'fim_intervalo', e.target.value)}
                          className="px-2 py-1 bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-stone-300 bg-white hover:bg-pastel-sand text-stone-700 font-bold uppercase tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || carregando}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider border border-stone-900 transition flex items-center space-x-2 disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 text-pastel-sage" />
              <span>{salvando ? 'Salvando...' : 'Salvar Jornada'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
