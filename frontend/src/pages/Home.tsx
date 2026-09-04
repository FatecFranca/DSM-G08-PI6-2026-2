import React from 'react';
import { CalendarCheck, ShieldCheck, Zap, Scissors, Sparkles, Brain, ArrowRight, Star, Clock } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Vite + React + TypeScript + Node.js</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Agende seus serviços favoritos em{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  poucos cliques
                </span>.
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Diga adeus às esperas no WhatsApp e duplicidade de marcações. Nossa plataforma calcula horários livres em tempo real com garantia anti-sobreposição (*zero double-booking*) e inteligência de sentimentos.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate('agendamento')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
                >
                  <Zap className="w-5 h-5" />
                  <span>Experimentar Agendamento</span>
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-7 py-4 rounded-2xl shadow-sm transition"
                >
                  <span>Painel do Prestador</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Badges de Qualidade */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-black text-slate-900">0%</p>
                  <p className="text-xs font-semibold text-slate-500">Conflito de Horário</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-indigo-600">&lt; 1s</p>
                  <p className="text-xs font-semibold text-slate-500">Análise de Sentimentos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">100%</p>
                  <p className="text-xs font-semibold text-slate-500">Cloud Ready</p>
                </div>
              </div>
            </div>

            {/* Preview Card Interativo */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-inner">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Barbearia VIP Vintage</h3>
                      <p className="text-xs text-slate-500">Av. Paulista, 1000 - SP</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    Aberto Hoje
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-slate-800">Corte de Cabelo Degradê</p>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> 45 minutos
                    </p>
                  </div>
                  <span className="text-base font-extrabold text-indigo-600">R$ 50,00</span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-2">Slots Livres Hoje (RF05):</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:border-indigo-600">09:30</button>
                    <button className="py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">11:00</button>
                    <button className="py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:border-indigo-600">14:30</button>
                  </div>
                </div>

                <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                  <div className="flex items-center space-x-2 text-violet-800 text-xs font-bold mb-1">
                    <Brain className="w-4 h-4 text-violet-600" />
                    <span>Mineração de Dados em Tempo Real (RF10)</span>
                  </div>
                  <p className="text-xs text-violet-700 italic">"Profissional pontual e corte impecável!"</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-violet-200/60 text-[11px]">
                    <span className="font-bold text-emerald-700">Sentimento: Positivo (98%)</span>
                    <span className="text-slate-500 font-mono">0.12ms</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('agendamento')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-md"
                >
                  Abrir Fluxo de Agendamento Completo
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Cards de Navegação da 1ª Sprint */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900">Módulos da 1ª Sprint Integrados</h2>
            <p className="text-xs text-slate-500 mt-1">Navegue pelas telas desenvolvidas com React e conectadas à API Node.js</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate('agendamento')}
              className="p-5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-400 text-left transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600">1. Agendamento</h3>
              <p className="text-xs text-slate-500 mt-1">Cálculo de slots livres e anti-conflito (RF05, RF06, RF07).</p>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="p-5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 text-left transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600">2. Painel do Prestador</h3>
              <p className="text-xs text-slate-500 mt-1">Status semafóricos RNF06 e métricas de satisfação RF11.</p>
            </button>

            <button
              onClick={() => onNavigate('avaliacao')}
              className="p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 text-left transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600">3. Avaliações & IA</h3>
              <p className="text-xs text-slate-500 mt-1">Classificação automática com NLP em menos de 1 segundo (RNF02).</p>
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="p-5 rounded-2xl bg-slate-50 hover:bg-violet-50/50 border border-slate-200 hover:border-violet-400 text-left transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-violet-600">4. Autenticação</h3>
              <p className="text-xs text-slate-500 mt-1">Perfis de Cliente e Prestador com senhas criptografadas (RF01).</p>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
