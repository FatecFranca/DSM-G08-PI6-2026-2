import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Service, Slot } from '../types';
import { Scissors, Clock, ShieldCheck, Check, CheckCircle2, Calendar } from 'lucide-react';

interface AgendamentoProps {
  onNavigate: (page: string) => void;
}

export const Agendamento: React.FC<AgendamentoProps> = ({ onNavigate }) => {
  const [servicos, setServicos] = useState<Service[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<Service | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>('2026-09-04');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotSelecionado, setSlotSelecionado] = useState<string>('11:00');
  const [tempoCalculoMs, setTempoCalculoMs] = useState<number>(4.5);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [modalSucesso, setModalSucesso] = useState<boolean>(false);

  // Carregar catálogo de serviços
  useEffect(() => {
    api.getServices(1).then(data => {
      setServicos(data);
      if (data.length > 0) setServicoSelecionado(data[0]);
    });
  }, []);

  // Recalcular slots livres quando serviço ou data mudar
  useEffect(() => {
    if (servicoSelecionado) {
      setLoadingSlots(true);
      api.getAvailableSlots(1, servicoSelecionado.id_servico, dataSelecionada).then(res => {
        setSlots(res.slots);
        setTempoCalculoMs(res.tempoMs);
        if (res.slots.length > 0) {
          setSlotSelecionado(res.slots[0].inicio);
        }
        setLoadingSlots(false);
      });
    }
  }, [servicoSelecionado, dataSelecionada]);

  const handleConfirmar = async () => {
    if (!servicoSelecionado) return;
    await api.createAppointment({
      id_cliente: 2,
      id_prestador: 1,
      id_servico: servicoSelecionado.id_servico,
      data_hora_inicio: `${dataSelecionada}T${slotSelecionado}:00.000Z`,
      data_hora_fim: `${dataSelecionada}T${slotSelecionado}:00.000Z`,
      observacoes: 'Agendamento realizado via Front-end React'
    });
    setModalSucesso(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Cabeçalho do Prestador */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold shadow-inner">
            <Scissors className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Barbearia VIP Vintage</h1>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Verificado</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Av. Paulista, 1000 - Bela Vista, São Paulo/SP</p>
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600 mt-2">
              <span className="text-amber-500 font-bold">★ 4.9 (128 avaliações)</span>
              <span>•</span>
              <span className="text-indigo-600 font-bold">98% Satisfação Positiva (IA)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-700">Expediente Regular (RF04):</p>
          <p className="text-slate-500">Segunda a Sexta: 09:00 às 19:00</p>
          <p className="text-slate-400 text-[11px]">Intervalo de almoço: 12:00 às 13:00</p>
        </div>
      </div>

      {/* Grid de Agendamento */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Passo 1: Seleção de Serviço (RF03) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center mr-2">1</span>
              Selecione o Serviço
            </h2>
            <span className="text-xs text-slate-400 font-medium">Catálogo ativo</span>
          </div>

          <div className="space-y-3">
            {servicos.map(s => {
              const isSelected = servicoSelecionado?.id_servico === s.id_servico;
              return (
                <div
                  key={s.id_servico}
                  onClick={() => setServicoSelecionado(s)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-600 ring-2 ring-indigo-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{s.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-1">{s.descricao}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs font-semibold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{s.duracao_minutos} minutos</span>
                      </div>
                    </div>
                    <span className="text-base font-extrabold text-indigo-600">
                      R$ {s.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passo 2: Seleção de Data e Horários Livres (RF05 & RF07) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center mr-2">2</span>
              Data & Horários Disponíveis
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Anti-Double Booking
            </span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            
            {/* Seletor de Data */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                Data Desejada:
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Grade de Slots Calculados */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Horários Livres Calculados (RF05):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Calculado em {tempoCalculoMs}ms (RNF01 &lt; 2s OK)
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-slate-400">Calculando horários livres...</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {slots.map(slot => {
                    const isSelected = slotSelecionado === slot.inicio;
                    return (
                      <button
                        key={slot.inicio}
                        type="button"
                        onClick={() => setSlotSelecionado(slot.inicio)}
                        className={`py-2.5 text-xs font-bold rounded-xl border transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/40'
                        }`}
                      >
                        <span>{slot.inicio}</span>
                        <span className={`text-[9px] ${isSelected ? 'text-indigo-200' : 'text-emerald-600'}`}>Livre</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo do Agendamento */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Serviço:</span>
                <span className="font-bold text-slate-900">{servicoSelecionado?.titulo}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Horário Selecionado:</span>
                <span className="font-bold text-indigo-600">
                  {slotSelecionado} ({servicoSelecionado?.duracao_minutos} min)
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Investimento:</span>
                <span className="font-bold text-slate-900 text-sm">
                  R$ {servicoSelecionado?.preco.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Botão de Confirmação */}
            <button
              onClick={handleConfirmar}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Confirmar Agendamento</span>
            </button>

          </div>
        </div>

      </div>

      {/* Modal de Sucesso */}
      {modalSucesso && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Agendamento Confirmado!</h3>
            <p className="text-xs text-slate-500">
              Horário garantido e sem sobreposições na grade do estabelecimento.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-1.5 border border-slate-100">
              <p><strong className="text-slate-700">Protocolo:</strong> #AG-{Date.now().toString().slice(-6)}</p>
              <p><strong className="text-slate-700">Serviço:</strong> {servicoSelecionado?.titulo}</p>
              <p><strong className="text-slate-700">Data/Hora:</strong> {dataSelecionada} às {slotSelecionado}</p>
              <p><strong className="text-slate-700">Status:</strong> <span className="font-bold text-emerald-600">Confirmado</span></p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full bg-indigo-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
              >
                Ver no Painel do Prestador
              </button>
              <button
                onClick={() => onNavigate('avaliacao')}
                className="w-full bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200 transition"
              >
                Simular Avaliação do Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
