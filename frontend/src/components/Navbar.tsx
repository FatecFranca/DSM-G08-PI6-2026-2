import React from 'react';
import { CalendarCheck, User, LayoutDashboard, Star, Calendar } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="bg-[#FAF9F6] border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo minimalista com ângulos retos */}
        <button onClick={() => onNavigate('home')} className="flex items-center space-x-3 text-left group">
          <div className="w-10 h-10 bg-stone-900 flex items-center justify-center text-white border border-stone-900 group-hover:bg-stone-800 transition">
            <CalendarCheck className="w-5 h-5 text-pastel-sage" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-stone-900 uppercase">
              Agendou<span className="text-pastel-sage-dark font-light">.</span>
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-stone-400 font-semibold">
              PI 6º • Minimal
            </span>
          </div>
        </button>

        {/* Links Minimalistas com cores pastéis */}
        <nav className="hidden md:flex items-center space-x-1 text-xs uppercase tracking-wider font-bold text-stone-600">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-2 border transition ${
              currentPage === 'home'
                ? 'bg-pastel-sand text-stone-900 border-stone-300'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            Início
          </button>
          
          <button
            onClick={() => onNavigate('agendamento')}
            className={`px-4 py-2 border flex items-center space-x-2 transition ${
              currentPage === 'agendamento'
                ? 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark/30 font-extrabold'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendamento</span>
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-2 border flex items-center space-x-2 transition ${
              currentPage === 'dashboard'
                ? 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark/30 font-extrabold'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Painel</span>
          </button>

          <button
            onClick={() => onNavigate('avaliacao')}
            className={`px-4 py-2 border flex items-center space-x-2 transition ${
              currentPage === 'avaliacao'
                ? 'bg-pastel-amber text-pastel-amber-dark border-pastel-amber-dark/30 font-extrabold'
                : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Avaliações & IA</span>
          </button>
        </nav>

        {/* Botão de Conta Minimalista */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('login')}
            className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 px-5 py-2.5 border transition ${
              currentPage === 'login'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-800 border-stone-300 hover:border-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Minha Conta</span>
          </button>
        </div>

      </div>
    </header>
  );
};
