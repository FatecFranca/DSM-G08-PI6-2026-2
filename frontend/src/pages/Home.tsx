import React from 'react';
import { Zap, Scissors, Brain, ArrowRight, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section Minimalista */}
      <section className="pt-16 lg:pt-24 border-b border-stone-200 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-8 text-left">
              
              <div className="inline-flex items-center space-x-2 bg-pastel-sand border border-stone-300 px-3.5 py-1.5 text-stone-700 text-xs font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-stone-900"></span>
                <span>Plataforma de Agendamentos Inteligentes</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-normal text-stone-900 tracking-tight leading-[1.08]">
                Agendamento de serviços, <br />
                <span className="font-serif italic text-stone-600">simples e preciso.</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed font-light">
                Descubra estabelecimentos, reserve horários livres calculados em tempo real sem atrito de mensagens e acompanhe a reputação com análise automática de sentimentos.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('agendamento')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 border border-stone-900 transition"
                >
                  <Zap className="w-4 h-4 text-pastel-sage" />
                  <span>Realizar Agendamento</span>
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-pastel-sand border border-stone-300 text-stone-800 font-bold text-xs uppercase tracking-wider px-7 py-4 transition"
                >
                  <span>Área do Prestador</span>
                  <ArrowRight className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              {/* Indicadores Minimalistas com Linhas Retas */}
              <div className="pt-8 border-t border-stone-200 grid grid-cols-3 gap-8 max-w-lg">
                <div>
                  <p className="text-3xl font-light text-stone-900 font-mono">0.00%</p>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Conflitos de Agenda</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-pastel-sage-dark font-mono">&lt; 10ms</p>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Classificação IA</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-stone-900 font-mono">100%</p>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mt-1">Disponibilidade</p>
                </div>
              </div>
            </div>

            {/* Card de Demonstração / Preview Interativo */}
            <div className="lg:col-span-5">
              <div className="bg-white border-2 border-stone-900 p-8 space-y-6">
                
                <div className="flex items-center justify-between border-b border-stone-200 pb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pastel-sand border border-stone-300 flex items-center justify-center text-stone-800">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-base">Barbearia VIP Vintage</h3>
                      <p className="text-xs text-stone-400 font-mono">São Paulo, SP</p>
                    </div>
                  </div>
                  <span className="bg-pastel-sage border border-pastel-sage-dark/30 text-pastel-sage-dark text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                    Aberto Hoje
                  </span>
                </div>

                <div className="p-4 bg-pastel-cream border border-stone-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-stone-900">Corte de Cabelo Degradê</p>
                    <p className="text-xs text-stone-500 flex items-center mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1 text-stone-400" /> 45 minutos
                    </p>
                  </div>
                  <span className="text-lg font-mono font-bold text-stone-900">R$ 50,00</span>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">
                    Horários Livres Hoje:
                  </p>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <div className="py-2 px-1 text-center border border-stone-200 bg-pastel-cream text-stone-600">09:30</div>
                    <div className="py-2 px-1 text-center bg-stone-900 text-white font-bold">11:00</div>
                    <div className="py-2 px-1 text-center border border-stone-200 bg-pastel-cream text-stone-600">14:30</div>
                  </div>
                </div>

                <div className="p-4 bg-pastel-lavender border border-pastel-lavender-dark/20 space-y-2">
                  <div className="flex items-center space-x-2 text-pastel-lavender-dark text-xs font-bold uppercase tracking-wider">
                    <Brain className="w-4 h-4" />
                    <span>Análise de Sentimentos em Tempo Real</span>
                  </div>
                  <p className="text-xs text-stone-700 italic">"Pontualidade excelente e corte de alta precisão."</p>
                  <div className="flex items-center justify-between pt-2 border-t border-pastel-lavender-dark/20 text-[11px]">
                    <span className="font-bold text-stone-900">Sentimento: Positivo</span>
                    <span className="font-mono text-stone-500">Score: 0.98</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('agendamento')}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-wider font-bold py-3.5 border border-stone-900 transition"
                >
                  Agendar este Estabelecimento
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Como Funciona - Minimalista e Focado no Produto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-stone-200 bg-white p-10 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-6 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Experiência Simples</span>
              <h2 className="text-2xl font-normal text-stone-900 tracking-tight mt-1">Como Funciona</h2>
            </div>
            <span className="text-xs text-stone-500 font-mono">Agendamento em 3 etapas</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 font-mono text-xs">
            
            <div className="p-6 border border-stone-300 bg-pastel-cream space-y-3">
              <span className="text-2xl font-light text-stone-400">01</span>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm font-sans">Selecione o Serviço</h3>
              <p className="text-stone-600 font-light font-sans text-xs leading-relaxed">
                Escolha o procedimento desejado no catálogo do prestador com transparência de preços e duração estimada.
              </p>
            </div>

            <div className="p-6 border border-stone-300 bg-pastel-cream space-y-3">
              <span className="text-2xl font-light text-stone-400">02</span>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm font-sans">Escolha o Horário Livre</h3>
              <p className="text-stone-600 font-light font-sans text-xs leading-relaxed">
                Veja apenas os slots de horário verdadeiramente disponíveis, calculados sem risco de colisão de agenda.
              </p>
            </div>

            <div className="p-6 border border-stone-300 bg-pastel-cream space-y-3">
              <span className="text-2xl font-light text-stone-400">03</span>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-sm font-sans">Confirme & Avalie</h3>
              <p className="text-stone-600 font-light font-sans text-xs leading-relaxed">
                Receba o protocolo instantâneo e, pós-atendimento, compartilhe sua opinião avaliada por inteligência artificial.
              </p>
            </div>

          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200">
            <div className="flex items-center space-x-2 text-stone-600 text-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-pastel-sage-dark" />
              <span>Garantia de atendimento sem duplicidade e sem filas.</span>
            </div>
            <button
              onClick={() => onNavigate('agendamento')}
              className="px-6 py-3 bg-stone-900 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-stone-800 transition"
            >
              Iniciar Agora →
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
