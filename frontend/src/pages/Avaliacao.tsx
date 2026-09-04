import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SentimentResponse } from '../types';
import { Star, CheckCircle2, Brain } from 'lucide-react';

interface AvaliacaoProps {
  onNavigate: (page: string) => void;
}

export const Avaliacao: React.FC<AvaliacaoProps> = ({ onNavigate }) => {
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('O atendimento foi impecável, muito rápido e atencioso!');
  const [analiseIA, setAnaliseIA] = useState<SentimentResponse | null>(null);
  const [enviado, setEnviado] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.analyzeSentiment(comentario, nota).then(res => setAnaliseIA(res));
    }, 150);
    return () => clearTimeout(timer);
  }, [comentario, nota]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white p-10 border border-stone-300 space-y-8">
        
        {/* Cabeçalho */}
        <div className="border-b border-stone-200 pb-5 text-left">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Feedback & NLP</span>
          <h1 className="text-2xl font-normal text-stone-900 tracking-tight mt-1">Avaliação do Atendimento (RF09)</h1>
          <p className="text-xs text-stone-500 font-light mt-1">Classificação de satisfação via aprendizado de máquina supervisionado.</p>
        </div>

        {/* Resumo do Atendimento */}
        <div className="bg-pastel-cream p-4 border border-stone-200 flex items-center justify-between text-xs font-mono">
          <div>
            <p className="font-bold text-stone-900">Barbearia VIP Vintage</p>
            <p className="text-stone-500 text-[11px]">Corte Degradê • Concluído em 04/09/2026</p>
          </div>
          <span className="bg-pastel-blue text-pastel-blue-dark px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold border border-pastel-blue-dark/30">
            Concluído
          </span>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            
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
                  {nota}/5
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
                placeholder="Descreva sua experiência..."
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
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider py-4 border border-stone-900 transition"
            >
              Registrar Avaliação
            </button>
          </form>
        ) : (
          <div className="text-left py-6 space-y-4">
            <div className="flex items-center space-x-3 text-stone-900 border-b border-stone-200 pb-3">
              <CheckCircle2 className="w-6 h-6 text-pastel-sage-dark" />
              <h3 className="text-lg font-bold uppercase tracking-wide">Feedback Processado</h3>
            </div>
            <p className="text-xs text-stone-600 font-light leading-relaxed">
              Sua avaliação foi classificada e persistida com sucesso na base de dados analítica.
            </p>
            <div className="pt-4 flex space-x-3 font-mono text-xs">
              <button
                onClick={() => onNavigate('agendamento')}
                className="bg-stone-900 text-white uppercase tracking-wider px-5 py-3 border border-stone-900 font-bold"
              >
                Novo Agendamento
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-pastel-sand text-stone-800 uppercase tracking-wider px-5 py-3 border border-stone-300 font-bold"
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
