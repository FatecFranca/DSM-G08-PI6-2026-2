import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment, SentimentResponse, Service } from '../types';
import { Star, CheckCircle2, Brain } from 'lucide-react';

interface AvaliacaoProps {
  onNavigate: (page: string) => void;
}

export const Avaliacao: React.FC<AvaliacaoProps> = ({ onNavigate }) => {
  const [servicos, setServicos] = useState<Service[]>([]);
  const [agendamentosConcluidos, setAgendamentosConcluidos] = useState<Appointment[]>([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<number | null>(null);
  const [servicoSelecionado, setServicoSelecionado] = useState<Service | null>(null);
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('O atendimento e a didática foram excelentes, super recomendo!');
  const [analiseIA, setAnaliseIA] = useState<SentimentResponse | null>(null);
  const [enviado, setEnviado] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erro, setErro] = useState('');

  // Carregar lista de serviços e sincronizar serviço alvo
  useEffect(() => {
    let appointmentId: number | undefined;
    try {
      const raw = localStorage.getItem('agendou_avaliacao_alvo');
      if (raw) appointmentId = Number((JSON.parse(raw) as { id_agendamento?: number }).id_agendamento);
    } catch (error) {
      console.error('Não foi possível ler o atendimento selecionado para avaliação.', error);
    }

    Promise.all([api.getServices(), api.getAppointments()])
      .then(([lista, appointments]) => {
        setServicos(lista);
        const concluidos = appointments.filter(appointment => appointment.status === 'Concluído' && !appointment.avaliado);
        setAgendamentosConcluidos(concluidos);
        const selected = concluidos.find(appointment => appointment.id_agendamento === appointmentId) || concluidos[0];
        if (selected) {
          setAgendamentoSelecionado(selected.id_agendamento);
          setServicoSelecionado(lista.find(service => service.id_servico === selected.id_servico) || null);
        }
      })
      .catch(error => setErro(error instanceof Error ? error.message : 'Não foi possível carregar os atendimentos concluídos.'));
  }, []);

  // Executar análise de sentimento em tempo real (RF10 & RNF02)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (comentario.trim()) {
        api.analyzeSentiment(comentario, nota)
          .then(res => setAnaliseIA(res))
          .catch(error => setErro(error instanceof Error ? error.message : 'Não foi possível classificar o comentário.'));
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [comentario, nota]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim() || !agendamentoSelecionado) return;

    setSalvando(true);
    try {
      await api.submitReview({ id_agendamento: agendamentoSelecionado, nota, comentario });
      localStorage.removeItem('agendou_avaliacao_alvo');
      setEnviado(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar a avaliação.');
    } finally {
      setSalvando(false);
    }
  };

  const handleReset = () => {
    setEnviado(false);
    setComentario('Atendimento muito bom e pontual!');
    setNota(5);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white p-10 border border-stone-300 space-y-8 text-left">
        {erro && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
        
        {/* Cabeçalho */}
        <div className="border-b border-stone-200 pb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Feedback & NLP</span>
          <h1 className="text-2xl font-normal text-stone-900 tracking-tight mt-1">Avaliação do Atendimento (RF09)</h1>
          <p className="text-xs text-stone-500 font-light mt-1">Classificação de sentimento aplicada aos comentários após a conclusão do atendimento.</p>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Seletor Dinâmico de Serviço (RF09) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
                Serviço a Ser Avaliado:
              </label>
              <select
                value={agendamentoSelecionado || ''}
                onChange={e => {
                  const id = Number(e.target.value);
                  const selected = agendamentosConcluidos.find(appointment => appointment.id_agendamento === id);
                  if (selected) {
                    setAgendamentoSelecionado(id);
                    setServicoSelecionado(servicos.find(service => service.id_servico === selected.id_servico) || null);
                  }
                }}
                className="w-full p-3 bg-pastel-cream border border-stone-300 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-stone-900"
              >
                {agendamentosConcluidos.map(appointment => (
                  <option key={appointment.id_agendamento} value={appointment.id_agendamento}>
                    #{appointment.id_agendamento} — {appointment.servico_titulo} ({api.extrairData(appointment.data_hora_inicio)})
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-mono text-stone-400">
                Somente atendimentos concluídos e ainda não avaliados podem receber feedback.
              </p>
            </div>

            {/* Resumo do Atendimento Selecionado */}
            <div className="bg-pastel-cream p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Atendimento Vinculado</span>
                <p className="font-bold text-stone-900 text-sm mt-0.5">
                  {servicoSelecionado ? servicoSelecionado.titulo : 'Carregando serviço...'}
                </p>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  {servicoSelecionado ? `${servicoSelecionado.duracao_minutos} min • R$ ${servicoSelecionado.preco.toFixed(2).replace('.', ',')}` : ''} • Concluído em {api.extrairData(agendamentosConcluidos.find(appointment => appointment.id_agendamento === agendamentoSelecionado)?.data_hora_inicio || '')}
                </p>
              </div>
              <span className="bg-pastel-blue text-pastel-blue-dark px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold border border-pastel-blue-dark/30 self-start sm:self-auto">
                {agendamentoSelecionado ? `Atendimento #${agendamentoSelecionado}` : 'Sem atendimento concluído'}
              </span>
            </div>
            
            {/* Seletor de Estrelas Minimalista */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
                Pontuação Numérica (1 a 5):
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(starValue => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setNota(starValue)}
                    className="p-1.5 border border-stone-200 hover:border-stone-900 transition bg-pastel-cream"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        starValue <= nota
                          ? 'fill-stone-900 text-stone-900'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono text-xs font-bold text-stone-800 ml-2">
                  {nota}/5 estrelas
                </span>
              </div>
            </div>

            {/* Comentário */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
                  Feedback em Texto:
                </label>
                <span className="text-[10px] font-mono text-stone-400">Classificação Automática (RF10)</span>
              </div>
              <textarea
                rows={3}
                required
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder={`Descreva sua experiência com o serviço "${servicoSelecionado?.titulo || 'selecionado'}"...`}
                className="w-full p-4 bg-pastel-cream border border-stone-300 text-sm font-light text-stone-800 focus:outline-none focus:border-stone-900 transition"
              />
            </div>

            {/* Painel da IA de Sentimento em Cores Pastéis (RF10 & RNF02) */}
            {analiseIA && (
              <div className="p-5 bg-pastel-lavender border border-pastel-lavender-dark/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2 text-pastel-lavender-dark font-bold uppercase tracking-wider text-[11px]">
                    <Brain className="w-4 h-4" />
                    <span>Mineração de Dados (NLP)</span>
                  </div>
                  <span className="text-[10px] text-stone-500">
                    Inferência: {analiseIA.tempoProcessamentoMs}ms ({analiseIA.rnf02_status})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-pastel-lavender-dark/20 font-mono">
                  <span className="text-stone-700">Rótulo Classificado:</span>
                  <span
                    className={`inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-bold border ${
                      analiseIA.sentimento === 'Positivo'
                        ? 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark/40'
                        : 'bg-pastel-peach text-pastel-peach-dark border-pastel-peach-dark/40'
                    }`}
                  >
                    {analiseIA.sentimento} ({(analiseIA.confianca * 100).toFixed(0)}% confiança)
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando || !agendamentoSelecionado}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider py-4 border border-stone-900 transition disabled:opacity-50"
            >
              {salvando ? 'Processando Avaliação...' : 'Registrar Avaliação'}
            </button>
          </form>
        ) : (
          <div className="py-6 space-y-5">
            <div className="flex items-center space-x-3 text-stone-900 border-b border-stone-200 pb-3">
              <CheckCircle2 className="w-6 h-6 text-pastel-sage-dark" />
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide">Feedback Processado com Sucesso</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Avaliação vinculada a: <strong>{servicoSelecionado?.titulo}</strong>
                </p>
              </div>
            </div>

            <div className="bg-pastel-cream p-4 border border-stone-200 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Nota Atribuída:</span>
                <span className="font-bold text-stone-900">{nota}/5 ★</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Sentimento Identificado (IA):</span>
                <span className={`font-bold ${analiseIA?.sentimento === 'Positivo' ? 'text-pastel-sage-dark' : 'text-pastel-peach-dark'}`}>
                  {analiseIA?.sentimento} ({analiseIA ? (analiseIA.confianca * 100).toFixed(0) : '96'}% confiança)
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 text-stone-600 italic">
                "{comentario}"
              </div>
            </div>

            <p className="text-xs text-stone-600 font-light leading-relaxed">
              Sua avaliação foi classificada pelo módulo de sentimento da API e persistida no PostgreSQL.
            </p>

            <div className="pt-3 flex flex-wrap gap-3 font-mono text-xs">
              <button
                onClick={handleReset}
                className="bg-pastel-cream hover:bg-pastel-sand text-stone-800 uppercase tracking-wider px-4 py-3 border border-stone-300 font-bold transition"
              >
                Avaliar Outro Serviço
              </button>
              <button
                onClick={() => onNavigate('agendamento')}
                className="bg-stone-900 text-white uppercase tracking-wider px-4 py-3 border border-stone-900 font-bold hover:bg-stone-800 transition"
              >
                Novo Agendamento
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-pastel-sand text-stone-800 uppercase tracking-wider px-4 py-3 border border-stone-300 font-bold hover:bg-stone-200 transition"
              >
                Painel do Prestador
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
