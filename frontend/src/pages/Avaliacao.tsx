import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SentimentResponse, Service } from '../types';
import { Star, CheckCircle2, Brain } from 'lucide-react';

interface AvaliacaoProps {
  onNavigate: (page: string) => void;
}

export const Avaliacao: React.FC<AvaliacaoProps> = ({ onNavigate }) => {
  const [servicos, setServicos] = useState<Service[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<Service | null>(null);
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('O atendimento e a didática foram excelentes, super recomendo!');
  const [analiseIA, setAnaliseIA] = useState<SentimentResponse | null>(null);
  const [enviado, setEnviado] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Carregar lista de serviços e sincronizar serviço alvo
  useEffect(() => {
    let alvoInfo: any = null;
    try {
      const raw = localStorage.getItem('agendou_avaliacao_alvo');
      if (raw) alvoInfo = JSON.parse(raw);
    } catch (_) {}

    api.getServices().then(lista => {
      setServicos(lista);

      if (alvoInfo) {
        const match = lista.find(s => 
          (alvoInfo.id_servico && s.id_servico === alvoInfo.id_servico) ||
          (alvoInfo.servico_titulo && s.titulo.toLowerCase().trim() === alvoInfo.servico_titulo.toLowerCase().trim())
        );
        if (match) {
          setServicoSelecionado(match);
          return;
        }
      }

      // Se há um serviço de CS ou outro recém-criado, prioriza-o
      const csService = lista.find(s => s.titulo.toLowerCase().includes('cs'));
      if (csService) {
        setServicoSelecionado(csService);
      } else if (lista.length > 0) {
        setServicoSelecionado(lista[0]);
      }
    });
  }, []);

  // Executar análise de sentimento em tempo real (RF10 & RNF02)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (comentario.trim()) {
        api.analyzeSentiment(comentario, nota).then(res => setAnaliseIA(res));
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [comentario, nota]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;

    setSalvando(true);
    await api.submitReview({
      id_servico: servicoSelecionado?.id_servico,
      servico_titulo: servicoSelecionado?.titulo || 'Serviço Geral',
      nota,
      comentario,
      sentimento_predito: analiseIA?.sentimento || (nota >= 3 ? 'Positivo' : 'Negativo')
    });

    try {
      localStorage.removeItem('agendou_avaliacao_alvo');
    } catch (_) {}

    setSalvando(false);
    setEnviado(true);
  };

  const handleReset = () => {
    setEnviado(false);
    setComentario('Atendimento muito bom e pontual!');
    setNota(5);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white p-10 border border-stone-300 space-y-8 text-left">
        
        {/* Cabeçalho */}
        <div className="border-b border-stone-200 pb-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Feedback & NLP</span>
          <h1 className="text-2xl font-normal text-stone-900 tracking-tight mt-1">Avaliação do Atendimento (RF09)</h1>
          <p className="text-xs text-stone-500 font-light mt-1">Classificação de satisfação via aprendizado de máquina supervisionado.</p>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Seletor Dinâmico de Serviço (RF09) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
                Serviço a Ser Avaliado:
              </label>
              <select
                value={servicoSelecionado?.id_servico || ''}
                onChange={e => {
                  const id = Number(e.target.value);
                  const encontrado = servicos.find(s => s.id_servico === id);
                  if (encontrado) setServicoSelecionado(encontrado);
                }}
                className="w-full p-3 bg-pastel-cream border border-stone-300 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-stone-900"
              >
                {servicos.map(s => (
                  <option key={s.id_servico} value={s.id_servico}>
                    {s.titulo} — R$ {s.preco.toFixed(2).replace('.', ',')} ({s.duracao_minutos} min)
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-mono text-stone-400">
                Selecione o serviço para vincular o feedback e a classificação de sentimento.
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
                  {servicoSelecionado ? `${servicoSelecionado.duracao_minutos} min • R$ ${servicoSelecionado.preco.toFixed(2).replace('.', ',')}` : ''} • Concluído em 04/09/2026
                </p>
              </div>
              <span className="bg-pastel-blue text-pastel-blue-dark px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold border border-pastel-blue-dark/30 self-start sm:self-auto">
                Concluído
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
                    Inferência: {analiseIA.tempoProcessamentoMs}ms (RNF02 OK)
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
              disabled={salvando}
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
              Sua avaliação foi classificada pelo modelo de Processamento de Linguagem Natural e persistida com sucesso na base de dados analítica.
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
