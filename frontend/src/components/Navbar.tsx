import React, { useState, useEffect } from 'react';
import { CalendarCheck, User, LayoutDashboard, Star, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [usuario, setUsuario] = useState<UserProfile>(api.getCurrentUser());

  useEffect(() => {
    const handleAuthChange = () => setUsuario(api.getCurrentUser());
    window.addEventListener('agendou_auth_changed', handleAuthChange);
    return () => window.removeEventListener('agendou_auth_changed', handleAuthChange);
  }, []);

  const sair = () => {
    api.logout();
    onNavigate('home');
  };

  return (
    <header className="bg-[#FAF9F6] border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
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

        <nav className="hidden md:flex items-center space-x-1 text-xs uppercase tracking-wider font-bold text-stone-600">
          <button onClick={() => onNavigate('home')} className={`px-4 py-2 border transition ${currentPage === 'home' ? 'bg-pastel-sand text-stone-900 border-stone-300' : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'}`}>
            Início
          </button>
          <button onClick={() => onNavigate('agendamento')} className={`px-4 py-2 border flex items-center space-x-2 transition ${currentPage === 'agendamento' ? 'bg-pastel-sage text-pastel-sage-dark border-pastel-sage-dark/30 font-extrabold' : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'}`}>
            <Calendar className="w-3.5 h-3.5" /><span>Agendamento</span>
          </button>
          <button onClick={() => onNavigate('dashboard')} className={`px-4 py-2 border flex items-center space-x-2 transition ${currentPage === 'dashboard' ? 'bg-pastel-blue text-pastel-blue-dark border-pastel-blue-dark/30 font-extrabold' : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'}`}>
            <LayoutDashboard className="w-3.5 h-3.5" /><span>Painel</span>
          </button>
          <button onClick={() => onNavigate('avaliacao')} className={`px-4 py-2 border flex items-center space-x-2 transition ${currentPage === 'avaliacao' ? 'bg-pastel-amber text-pastel-amber-dark border-pastel-amber-dark/30 font-extrabold' : 'border-transparent hover:border-stone-200 hover:bg-stone-100/60'}`}>
            <Star className="w-3.5 h-3.5" /><span>Avaliações & IA</span>
          </button>
        </nav>

        {usuario.id_usuario ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-mono font-bold text-stone-700">
              <User className="w-3.5 h-3.5" />{usuario.nome} ({usuario.tipo_perfil})
            </span>
            <button onClick={sair} className="px-3 py-2 border border-stone-300 text-xs font-bold uppercase hover:bg-pastel-sand">
              Sair
            </button>
          </div>
        ) : (
          <button onClick={() => onNavigate('login')} className="px-4 py-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800">
            Entrar / Cadastrar
          </button>
        )}
      </div>
    </header>
  );
};
