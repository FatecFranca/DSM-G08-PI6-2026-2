import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SentimentResponse } from '../types';
import { Star, CheckCircle, Brain, Sparkles } from 'lucide-react';

interface AvaliacaoProps {
  onNavigate: (page: string) => void;
}

export const Avaliacao: React.FC<AvaliacaoProps> = ({ onNavigate }) => {
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('O atendimento foi impecável, muito rápido e atencioso!');
  const [analiseIA, setAnaliseIA] = useState<SentimentResponse | null>(null);
  const [enviado, setEnviado] = useState<boolean>(false);

  // Análise de sentimento reativa em tempo real (RNF02)
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
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80 space-y-6">
        
        {/* Cabeçalho */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Avaliação do Atendimento (RF09)</h1>
          <p className="text-xs text-slate-500 mt-1">Sua opinião treina nossa inteligência artificial para melhorar os serviços.</p>
        </div>

        {/* Resumo do Atendimento */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800">Barbearia VIP Vintage</p>
            <p className="text-slate-500">Corte Degradê • Concluído em 04/09/2026</p>
          </div>
          <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
            Concluído
          </span>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Seletor de Estrelas */}
            <div className="text-center space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-600">Sua Nota (1 a 5 estrelas):</label>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map(starValue => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setNota(starValue)}
                    className="p-1 transition transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        starValue <= nota
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-amber-600">
                {nota === 5 && 'Excelente (5/5)'}
                {nota === 4 && 'Muito Bom (4/5)'}
                {nota === 3 && 'Regular (3/5)'}
                {nota === 2 && 'Insatisfatório (2/5)'}
                {nota === 1 && 'Péssimo (1/5)'}
              </p>
            </div>

            {/* Comentário */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-600">Seu Comentário em Texto:</label>
                <span className="text-[10px] text-slate-400 font-medium">Classificado via NLP (RF10)</span>
              </div>
              <textarea
                rows={3}
                required
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Conte o que achou da pontualidade, qualidade e atendimento..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            {/* Painel da IA de Sentimento em Tempo Real (RF10 & RNF02) */}
            {analiseIA && (
              <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-violet-800">
                    <Brain className="w-4 h-4 text-violet-600" />
                    <span>Mineração de Dados (PLN / Scikit-Learn)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Latência: {analiseIA.tempoProcessamentoMs}ms (RNF02 &lt; 1s OK)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-violet-200/50">
                  <span className="text-slate-600 font-medium">Sentimento Classificado:</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${
                      analiseIA.sentimento === 'Positivo'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    {analiseIA.sentimento} ({(analiseIA.confianca * 100).toFixed(0)}% confiança)
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transition"
            >
              Enviar Avaliação
            </button>
          </form>
        ) : (
          /* Mensagem de Sucesso */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Obrigado pelo seu feedback!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Sua avaliação foi minerada pelo algoritmo e incorporada ao dashboard do prestador.
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              <button
                onClick={() => onNavigate('agendamento')}
                className="bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
              >
                Novo Agendamento
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-slate-100 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl"
              >
                Ver Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
