import React from 'react';
import { CalendarCheck, User, LayoutDashboard, Star, Calendar } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <button onClick={() => onNavigate('home')} className="flex items-center space-x-3 text-left group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Agendou<span className="text-indigo-600">!</span></span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Multiplataforma • PI 6º</span>
          </div>
        </button>

        {/* Links de navegação */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-xl transition ${currentPage === 'home' ? 'text-indigo-600 bg-indigo-50' : 'hover:text-indigo-600 hover:bg-slate-50'}`}
          >
            Início
          </button>
          
          <button
            onClick={() => onNavigate('agendamento')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${currentPage === 'agendamento' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:text-indigo-600 hover:bg-slate-50'}`}
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Agendar Serviço</span>
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${currentPage === 'dashboard' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:text-indigo-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-500" />
            <span>Painel do Prestador</span>
          </button>

          <button
            onClick={() => onNavigate('avaliacao')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${currentPage === 'avaliacao' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:text-indigo-600 hover:bg-slate-50'}`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>Avaliações & IA</span>
          </button>
        </nav>

        {/* Botão de autenticação */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('login')}
            className={`text-sm font-bold flex items-center space-x-2 px-4 py-2.5 rounded-xl transition ${
              currentPage === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Minha Conta</span>
          </button>
        </div>

      </div>
    </header>
  );
};
