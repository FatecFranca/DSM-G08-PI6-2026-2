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

  useEffect(() => {
    api.getServices(1).then(data => {
      setServicos(data);
      if (data.length > 0) setServicoSelecionado(data[0]);
    });
  }, []);

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
      observacoes: 'Agendamento minimalista confirmado'
    });
    setModalSucesso(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      
      {/* Cabeçalho do Prestador Minimalista */}
      <div className="bg-white p-8 border border-stone-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-pastel-sand border border-stone-300 text-stone-800 flex items-center justify-center">
            <Scissors className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-normal text-stone-900 tracking-tight">Barbearia VIP Vintage</h1>
              <span className="bg-pastel-sage text-pastel-sage-dark border border-pastel-sage-dark/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                Verificado
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-1">Av. Paulista, 1000 - Bela Vista, São Paulo/SP</p>
            <div className="flex items-center space-x-4 text-xs font-mono text-stone-600 mt-2">
              <span className="text-pastel-amber-dark font-bold">★ 4.9 (128 avaliações)</span>
              <span>•</span>
              <span className="text-stone-900 font-semibold">98% Sentimento Positivo (IA)</span>
            </div>
          </div>
        </div>

        <div className="bg-pastel-cream p-4 border border-stone-200 text-xs font-mono space-y-1">
          <p className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">Jornada de Trabalho (RF04)</p>
          <p className="text-stone-600">Seg a Sex: 09:00 às 19:00</p>
          <p className="text-stone-400 text-[11px]">Pausa: 12:00 às 13:00</p>
        </div>
      </div>

      {/* Grid de Agendamento */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Passo 1: Seleção de Serviço (RF03) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-300 pb-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900 flex items-center">
              <span className="w-5 h-5 bg-stone-900 text-white text-xs flex items-center justify-center mr-2 font-mono">1</span>
              Catálogo de Serviços
            </h2>
            <span className="text-xs text-stone-400 font-mono">Tabela fixa</span>
          </div>

          <div className="space-y-3">
            {servicos.map(s => {
              const isSelected = servicoSelecionado?.id_servico === s.id_servico;
              return (
                <div
                  key={s.id_servico}
                  onClick={() => setServicoSelecionado(s)}
                  className={`p-5 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-pastel-sage border-pastel-sage-dark ring-1 ring-pastel-sage-dark'
                      : 'bg-white border-stone-200 hover:border-stone-400 hover:bg-pastel-cream'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{s.titulo}</h3>
                      <p className="text-xs text-stone-600 mt-1 font-light leading-relaxed">{s.descricao}</p>
                      <div className="flex items-center space-x-2 mt-3 text-xs font-mono text-stone-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{s.duracao_minutos} min</span>
                      </div>
                    </div>
                    <span className="text-lg font-mono font-bold text-stone-900">
                      R$ {s.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passo 2: Data e Slots Livres (RF05 & RF07) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-300 pb-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900 flex items-center">
              <span className="w-5 h-5 bg-stone-900 text-white text-xs flex items-center justify-center mr-2 font-mono">2</span>
              Horários Livres
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-wider text-pastel-sage-dark bg-pastel-sage px-2 py-0.5 border border-pastel-sage-dark/30 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Anti-Conflito Ativo
            </span>
          </div>

          <div className="bg-white p-6 border border-stone-300 space-y-6">
            
            {/* Seletor de Data */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 font-mono flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Data do Atendimento:
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                className="w-full px-4 py-2.5 bg-pastel-cream border border-stone-300 text-sm font-mono font-semibold text-stone-800 focus:outline-none focus:border-stone-900"
              />
            </div>

            {/* Grade de Slots com Sharp Angles */}
            <div>
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <label className="uppercase tracking-wider font-bold text-stone-500 text-[11px]">
                  Slots Calculados (RF05):
                </label>
                <span className="text-stone-400 text-[10px]">
                  {tempoCalculoMs}ms (RNF01 OK)
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs font-mono text-stone-400">Calculando horários...</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {slots.map(slot => {
                    const isSelected = slotSelecionado === slot.inicio;
                    return (
                      <button
                        key={slot.inicio}
                        type="button"
                        onClick={() => setSlotSelecionado(slot.inicio)}
                        className={`py-3 px-2 border transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 font-bold'
                            : 'bg-pastel-cream text-stone-800 border-stone-200 hover:border-stone-900 hover:bg-pastel-sand'
                        }`}
                      >
                        <span>{slot.inicio}</span>
                        <span className={`text-[9px] uppercase tracking-wider ${isSelected ? 'text-pastel-sage' : 'text-pastel-sage-dark'}`}>
                          Livre
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo */}
            <div className="border-t border-stone-200 pt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-stone-600">
                <span>Serviço:</span>
                <span className="font-bold text-stone-900">{servicoSelecionado?.titulo}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Horário:</span>
                <span className="font-bold text-stone-900">
                  {slotSelecionado} ({servicoSelecionado?.duracao_minutos} min)
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Total:</span>
                <span className="font-bold text-stone-900 text-base">
                  R$ {servicoSelecionado?.preco.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmar}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider py-4 border border-stone-900 transition flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4 text-pastel-sage" />
              <span>Confirmar Agendamento</span>
            </button>

          </div>
        </div>

      </div>

      {/* Modal de Sucesso Minimalista com Sharp Corners */}
      {modalSucesso && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 max-w-sm w-full text-left border-2 border-stone-900 space-y-5">
            <div className="flex items-center space-x-3 text-stone-900 border-b border-stone-200 pb-3">
              <CheckCircle2 className="w-6 h-6 text-pastel-sage-dark" />
              <h3 className="text-lg font-bold uppercase tracking-wide">Agendamento Confirmado</h3>
            </div>
            
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Horário alocado com validação anti-sobreposição.
            </p>

            <div className="bg-pastel-cream p-4 border border-stone-200 text-xs font-mono space-y-1.5">
              <p><strong>Protocolo:</strong> #AG-{Date.now().toString().slice(-6)}</p>
              <p><strong>Serviço:</strong> {servicoSelecionado?.titulo}</p>
              <p><strong>Horário:</strong> {dataSelecionada} às {slotSelecionado}</p>
              <p><strong>Status:</strong> <span className="bg-pastel-sage text-pastel-sage-dark px-2 py-0.5 border border-pastel-sage-dark/30 font-bold">Confirmado</span></p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider py-3 border border-stone-900 hover:bg-stone-800 transition"
              >
                Visualizar no Painel
              </button>
              <button
                onClick={() => onNavigate('avaliacao')}
                className="w-full bg-pastel-sand text-stone-800 text-xs font-bold uppercase tracking-wider py-3 border border-stone-300 hover:bg-stone-200 transition"
              >
                Simular Avaliação (IA)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
